import { z } from 'zod';

export const issueTypeOptions = [
  'Pothole',
  'Streetlight Out',
  'Graffiti',
  'Illegal Dumping',
  'Road Sign Damage',
  'Other',
] as const;

export type IssueType = (typeof issueTypeOptions)[number];

export const ReportPayloadSchema = z.object({
  userId: z.string().min(1),
  issueType: z.enum(issueTypeOptions),
  notes: z.string().max(2000).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
    zip: z.string().trim().min(3).max(12),
    formattedAddress: z.string().trim().optional(),
  }),
});

export type ReportPayload = z.infer<typeof ReportPayloadSchema>;

export const ReportStatusSchema = z.enum(['queued', 'sent', 'failed']);
export type ReportStatus = z.infer<typeof ReportStatusSchema>;

export const ReportRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  issueType: z.enum(issueTypeOptions),
  notes: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  formattedAddress: z.string().nullable(),
  authorityName: z.string(),
  authorityEmail: z.string().email(),
  authorityPhone: z.string().nullable(),
  authoritySource: z.enum(['exact', 'city_fallback', 'default']),
  emailSubject: z.string(),
  emailBody: z.string(),
  status: ReportStatusSchema,
  failureReason: z.string().nullable(),
  imageUrls: z.array(z.string().url()),
  thumbnailUrl: z.string().url().nullable(),
  createdAt: z.string(),
  sentAt: z.string().nullable(),
});

export type ReportRecord = z.infer<typeof ReportRecordSchema>;

export const AuthorityLookupSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  source: z.enum(['exact', 'city_fallback', 'default']),
});

export type AuthorityLookupResult = z.infer<typeof AuthorityLookupSchema>;

export const reportResponseSchema = z.object({
  report: ReportRecordSchema.nullable(),
  emailPreview: z.object({
    subject: z.string(),
    body: z.string(),
  }),
});

export type ReportResponse = z.infer<typeof reportResponseSchema>;

export const reportsListResponseSchema = z.object({
  reports: z.array(ReportRecordSchema),
});

export type ReportsListResponse = z.infer<typeof reportsListResponseSchema>;
