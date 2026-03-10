import { Platform } from 'react-native';
import type { ReportPayload, ReportRecord } from '@fixlocal/shared';
import { appConfig } from '../config';

export type LocalPhoto = {
  uri: string;
  name: string;
  type: string;
};

export type SubmitReportInput = {
  token: string;
  userId: string;
  issueType: ReportPayload['issueType'];
  notes?: string;
  location: ReportPayload['location'];
  photos: LocalPhoto[];
  mode: 'preview' | 'send';
  subject?: string;
  body?: string;
};

export type SubmitReportResponse = {
  report: ReportRecord | null;
  emailPreview: {
    subject: string;
    body: string;
  };
  error?: string;
  generation?: {
    strategy: 'ai' | 'fallback';
    fallbackReason?: string;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const buildUrl = (path: string): string => {
  if (!appConfig.apiBaseUrl) {
    throw new Error(
      'Missing EXPO_PUBLIC_API_URL. Configure API URL in EAS environment variables before release builds.',
    );
  }

  return `${appConfig.apiBaseUrl.replace(/\/$/, '')}${path}`;
};

const readErrorMessage = (payload: unknown): string => {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const errorValue = (payload as Record<string, unknown>).error;
    if (typeof errorValue === 'string') {
      return errorValue;
    }
  }

  return 'Request failed.';
};

export const submitReport = async (input: SubmitReportInput): Promise<SubmitReportResponse> => {
  const formData = new FormData();
  formData.append('userId', input.userId);
  formData.append('issueType', input.issueType);
  if (input.notes?.trim()) {
    formData.append('notes', input.notes.trim());
  }
  formData.append('location', JSON.stringify(input.location));
  formData.append('mode', input.mode);
  if (input.subject?.trim()) {
    formData.append('subject', input.subject.trim());
  }
  if (input.body?.trim()) {
    formData.append('body', input.body.trim());
  }

  await Promise.all(
    input.photos.map(async (photo, index) => {
      if (Platform.OS === 'web') {
        // On web, fetch the blob from the URI and append as File
        const response = await fetch(photo.uri);
        const blob = await response.blob();
        const fileName = photo.name || `issue-${index + 1}.jpg`;
        const file = new File([blob], fileName, { type: photo.type || 'image/jpeg' });
        formData.append('photos', file);
      } else {
        formData.append('photos', {
          uri: photo.uri,
          name: photo.name || `issue-${index + 1}.jpg`,
          type: photo.type || 'image/jpeg',
        } as never);
      }
    })
  );

  const response = await fetch(buildUrl('/api/report'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
    body: formData,
  });

  const payload = (await response.json()) as SubmitReportResponse;

  if (!response.ok) {
    throw new ApiError(readErrorMessage(payload), response.status, payload);
  }

  return payload;
};

export const getReports = async (token: string, userId: string): Promise<ReportRecord[]> => {
  const response = await fetch(buildUrl(`/api/reports?userId=${encodeURIComponent(userId)}`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json()) as { reports?: ReportRecord[]; error?: string };
  if (!response.ok) {
    throw new ApiError(payload.error ?? 'Failed to fetch reports.', response.status, payload);
  }

  return payload.reports ?? [];
};

export async function getLeaderboard(period: 'all' | 'weekly' = 'all') {
  const response = await fetch(buildUrl(`/api/leaderboard?period=${period}`));
  if (!response.ok) throw new ApiError('Failed to fetch leaderboard', response.status, null);
  return response.json() as Promise<{
    period: string;
    leaderboard: { rank: number; displayName: string; reportCount: number; isCurrentUser: boolean }[];
  }>;
}
