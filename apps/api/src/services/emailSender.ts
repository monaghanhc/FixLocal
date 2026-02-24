import { Resend } from 'resend';
import { env } from '../env.js';

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type SendAuthorityEmailInput = {
  to: string;
  subject: string;
  body: string;
  attachments: EmailAttachment[];
};

let resendClient: Resend | null = null;

const getResendClient = () => {
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }

  return resendClient;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const bodyToHtml = (body: string): string => {
  return escapeHtml(body)
    .split('\n')
    .map((line) => (line.trim() ? `<p>${line}</p>` : '<br />'))
    .join('');
};

export const sendAuthorityEmail = async (input: SendAuthorityEmailInput): Promise<string | null> => {
  const resend = getResendClient();

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [input.to],
    replyTo: env.EMAIL_REPLY_TO,
    subject: input.subject,
    text: input.body,
    html: bodyToHtml(input.body),
    attachments: input.attachments.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content.toString('base64'),
      contentType: attachment.contentType,
    })),
  });

  if (error) {
    throw new Error(error.message ?? 'Failed to send email.');
  }

  return data?.id ?? null;
};
