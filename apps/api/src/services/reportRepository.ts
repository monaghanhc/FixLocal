import type { ReportRecord } from '@fixlocal/shared';
import { supabase } from '../lib/supabase.js';

type ReportStatus = 'queued' | 'sent' | 'failed';

type ReportRow = {
  id: string;
  user_id: string;
  issue_type: ReportRecord['issueType'];
  notes: string | null;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  zip: string;
  formatted_address: string | null;
  authority_name: string;
  authority_email: string;
  authority_phone: string | null;
  authority_source: ReportRecord['authoritySource'];
  email_subject: string;
  email_body: string;
  status: ReportStatus;
  failure_reason: string | null;
  image_urls: string[];
  thumbnail_url: string | null;
  created_at: string;
  sent_at: string | null;
};

const reportColumns = [
  'id',
  'user_id',
  'issue_type',
  'notes',
  'latitude',
  'longitude',
  'city',
  'state',
  'zip',
  'formatted_address',
  'authority_name',
  'authority_email',
  'authority_phone',
  'authority_source',
  'email_subject',
  'email_body',
  'status',
  'failure_reason',
  'image_urls',
  'thumbnail_url',
  'created_at',
  'sent_at',
].join(', ');

const toRecord = (row: ReportRow): ReportRecord => {
  return {
    id: row.id,
    userId: row.user_id,
    issueType: row.issue_type,
    notes: row.notes,
    latitude: row.latitude,
    longitude: row.longitude,
    city: row.city,
    state: row.state,
    zip: row.zip,
    formattedAddress: row.formatted_address,
    authorityName: row.authority_name,
    authorityEmail: row.authority_email,
    authorityPhone: row.authority_phone,
    authoritySource: row.authority_source,
    emailSubject: row.email_subject,
    emailBody: row.email_body,
    status: row.status,
    failureReason: row.failure_reason,
    imageUrls: row.image_urls,
    thumbnailUrl: row.thumbnail_url,
    createdAt: row.created_at,
    sentAt: row.sent_at,
  };
};

export const createQueuedReport = async (input: {
  userId: string;
  issueType: ReportRecord['issueType'];
  notes?: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  zip: string;
  formattedAddress?: string;
  authorityName: string;
  authorityEmail: string;
  authorityPhone?: string | null;
  authoritySource: ReportRecord['authoritySource'];
  emailSubject: string;
  emailBody: string;
}): Promise<ReportRecord> => {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: input.userId,
      issue_type: input.issueType,
      notes: input.notes ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      city: input.city,
      state: input.state,
      zip: input.zip,
      formatted_address: input.formattedAddress ?? null,
      authority_name: input.authorityName,
      authority_email: input.authorityEmail,
      authority_phone: input.authorityPhone ?? null,
      authority_source: input.authoritySource,
      email_subject: input.emailSubject,
      email_body: input.emailBody,
      status: 'queued',
      image_urls: [],
      thumbnail_url: null,
    })
    .select(reportColumns)
    .single<ReportRow>();

  if (error || !data) {
    throw new Error(`Failed to create report: ${error?.message ?? 'No row returned.'}`);
  }

  return toRecord(data);
};

export const attachReportImages = async (
  reportId: string,
  imageUrls: string[],
): Promise<ReportRecord> => {
  const { data, error } = await supabase
    .from('reports')
    .update({
      image_urls: imageUrls,
      thumbnail_url: imageUrls[0] ?? null,
    })
    .eq('id', reportId)
    .select(reportColumns)
    .single<ReportRow>();

  if (error || !data) {
    throw new Error(`Failed to save report photos: ${error?.message ?? 'No row returned.'}`);
  }

  return toRecord(data);
};

export const markReportSent = async (reportId: string): Promise<ReportRecord> => {
  const { data, error } = await supabase
    .from('reports')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      failure_reason: null,
    })
    .eq('id', reportId)
    .select(reportColumns)
    .single<ReportRow>();

  if (error || !data) {
    throw new Error(`Failed to mark report sent: ${error?.message ?? 'No row returned.'}`);
  }

  return toRecord(data);
};

export const markReportFailed = async (
  reportId: string,
  failureReason: string,
): Promise<ReportRecord> => {
  const { data, error } = await supabase
    .from('reports')
    .update({
      status: 'failed',
      failure_reason: failureReason,
      sent_at: null,
    })
    .eq('id', reportId)
    .select(reportColumns)
    .single<ReportRow>();

  if (error || !data) {
    throw new Error(`Failed to mark report failed: ${error?.message ?? 'No row returned.'}`);
  }

  return toRecord(data);
};

export const listReportsForUser = async (userId: string): Promise<ReportRecord[]> => {
  const { data, error } = await supabase
    .from('reports')
    .select(reportColumns)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as ReportRow[];
  return rows.map((row) => toRecord(row));
};
