import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { ReportPayloadSchema } from '@fixlocal/shared';
import { requireSupabaseAuth } from '../middleware/auth.js';
import { reportRateLimiter } from '../middleware/reportRateLimit.js';
import { authorityService } from '../services/authority.js';
import { generateEmailDraft } from '../services/emailDraft.js';
import { sendAuthorityEmail } from '../services/emailSender.js';
import {
  attachReportImages,
  createQueuedReport,
  listReportsForUser,
  markReportFailed,
  markReportSent,
} from '../services/reportRepository.js';
import { uploadReportPhotos } from '../services/photoStorage.js';

const modeSchema = z.enum(['preview', 'send']).default('send');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 4,
    fileSize: 8 * 1024 * 1024,
  },
});

const parseLocation = (locationRaw: unknown): unknown => {
  if (typeof locationRaw === 'string') {
    return JSON.parse(locationRaw);
  }

  return locationRaw;
};

const reportsQuerySchema = z.object({
  userId: z.string().uuid(),
});

const reportBodySchema = z.object({
  userId: z.string().uuid(),
  issueType: z.string(),
  notes: z.string().optional(),
  location: z.any(),
  mode: modeSchema.optional(),
  subject: z.string().max(150).optional(),
  body: z.string().max(5000).optional(),
});

export const reportRouter = Router();

reportRouter.post(
  '/report',
  requireSupabaseAuth,
  reportRateLimiter,
  upload.array('photos', 4),
  async (req, res, next) => {
    try {
      const files = ((req.files as Express.Multer.File[] | undefined) ?? []).filter((file) =>
        file.mimetype.startsWith('image/'),
      );

      if (files.length === 0) {
        res.status(400).json({ error: 'At least one image must be provided.' });
        return;
      }

      const parsedBody = reportBodySchema.parse({
        ...req.body,
        location: parseLocation(req.body.location),
      });

      const payload = ReportPayloadSchema.parse({
        userId: parsedBody.userId,
        issueType: parsedBody.issueType,
        notes: parsedBody.notes,
        location: parsedBody.location,
      });

      const mode = modeSchema.parse(parsedBody.mode ?? 'send');
      const authUserId = req.auth?.userId;

      if (!authUserId || authUserId !== payload.userId) {
        res.status(403).json({ error: 'User mismatch between token and payload.' });
        return;
      }

      const authority = await authorityService.lookup(payload.location);
      const generated = await generateEmailDraft({
        issueType: payload.issueType,
        notes: payload.notes,
        location: payload.location,
        authority,
        photoCount: files.length,
      });

      const subject = parsedBody.subject?.trim() || generated.subject;
      const body = parsedBody.body?.trim() || generated.body;

      if (mode === 'preview') {
        res.status(200).json({
          report: null,
          emailPreview: {
            subject,
            body,
          },
          authority,
          generation: {
            strategy: generated.strategy,
            fallbackReason: generated.fallbackReason,
          },
        });
        return;
      }

      let report = await createQueuedReport({
        userId: payload.userId,
        issueType: payload.issueType,
        notes: payload.notes,
        latitude: payload.location.latitude,
        longitude: payload.location.longitude,
        city: payload.location.city,
        state: payload.location.state,
        zip: payload.location.zip,
        formattedAddress: payload.location.formattedAddress,
        authorityName: authority.name,
        authorityEmail: authority.email,
        authorityPhone: authority.phone,
        authoritySource: authority.source,
        emailSubject: subject,
        emailBody: body,
      });

      const imageUrls = await uploadReportPhotos({
        files,
        reportId: report.id,
        userId: payload.userId,
      });

      report = await attachReportImages(report.id, imageUrls);

      try {
        await sendAuthorityEmail({
          to: authority.email,
          subject,
          body,
          attachments: files.map((file, index) => ({
            filename: file.originalname || `issue-${index + 1}.jpg`,
            content: file.buffer,
            contentType: file.mimetype,
          })),
        });

        report = await markReportSent(report.id);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown delivery error';
        report = await markReportFailed(report.id, reason);

        res.status(502).json({
          report,
          emailPreview: {
            subject,
            body,
          },
          error: reason,
        });
        return;
      }

      res.status(201).json({
        report,
        emailPreview: {
          subject,
          body,
        },
        generation: {
          strategy: generated.strategy,
          fallbackReason: generated.fallbackReason,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

reportRouter.get('/reports', requireSupabaseAuth, async (req, res, next) => {
  try {
    const query = reportsQuerySchema.parse(req.query);

    if (req.auth?.userId !== query.userId) {
      res.status(403).json({ error: 'User mismatch between token and query.' });
      return;
    }

    const reports = await listReportsForUser(query.userId);
    res.status(200).json({ reports });
  } catch (error) {
    next(error);
  }
});
