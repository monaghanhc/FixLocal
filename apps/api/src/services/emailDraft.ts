import OpenAI from 'openai';
import { z } from 'zod';
import type { AuthorityLookupResult, ReportPayload } from '@fixlocal/shared';
import { env } from '../env.js';

const emailSchema = z.object({
  subject: z.string().min(5).max(150),
  body: z.string().min(30).max(5000),
});

export type EmailDraftInput = {
  issueType: ReportPayload['issueType'];
  notes?: string;
  location: ReportPayload['location'];
  authority: AuthorityLookupResult;
  photoCount: number;
};

export type EmailDraftResult = {
  subject: string;
  body: string;
  strategy: 'ai' | 'fallback';
  fallbackReason?: string;
};

type OpenAIResponseClient = {
  responses: {
    create: (params: unknown) => Promise<{ output_text?: string }>;
  };
};

let cachedOpenAIClient: OpenAIResponseClient | null | undefined;

const getOpenAIClient = (): OpenAIResponseClient | null => {
  if (cachedOpenAIClient !== undefined) {
    return cachedOpenAIClient;
  }

  if (!env.OPENAI_API_KEY) {
    cachedOpenAIClient = null;
    return null;
  }

  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  cachedOpenAIClient = client as OpenAIResponseClient;
  return cachedOpenAIClient;
};

const fallbackBody = (input: EmailDraftInput): string => {
  const noteText = input.notes?.trim()
    ? input.notes.trim()
    : 'No additional notes were provided by the reporter.';

  const locationLine = input.location.formattedAddress?.trim()
    ? `${input.location.formattedAddress} (${input.location.city}, ${input.location.state} ${input.location.zip})`
    : `${input.location.city}, ${input.location.state} ${input.location.zip}`;

  return [
    `Dear ${input.authority.name},`,
    '',
    'I am writing to report a civic issue that needs attention.',
    '',
    `Issue type: ${input.issueType}`,
    `Location: ${locationLine}`,
    `Coordinates: ${input.location.latitude.toFixed(6)}, ${input.location.longitude.toFixed(6)}`,
    `Photo attachments: ${input.photoCount}`,
    '',
    'Details from reporter:',
    noteText,
    '',
    'Please route this request to the appropriate team and share any next steps.',
    '',
    'Thank you,',
    'FixLocal Reporter',
  ].join('\n');
};

export const buildFallbackEmailDraft = (input: EmailDraftInput): EmailDraftResult => {
  return {
    subject: `${input.issueType} report near ${input.location.city}, ${input.location.state}`,
    body: fallbackBody(input),
    strategy: 'fallback',
  };
};

const systemPrompt = [
  'You are a civic reporting assistant.',
  'Write concise, professional emails to municipal departments.',
  'Output valid JSON with keys: subject and body.',
  'Do not include markdown or placeholders.',
].join(' ');

export const generateEmailDraft = async (
  input: EmailDraftInput,
  options?: {
    client?: OpenAIResponseClient | null;
  },
): Promise<EmailDraftResult> => {
  const openAIClient = options?.client ?? getOpenAIClient();

  if (!openAIClient) {
    return {
      ...buildFallbackEmailDraft(input),
      fallbackReason: 'OPENAI_API_KEY is not configured.',
    };
  }

  try {
    const response = await openAIClient.responses.create({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: systemPrompt }],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify(input),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'fixlocal_email',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              subject: {
                type: 'string',
              },
              body: {
                type: 'string',
              },
            },
            required: ['subject', 'body'],
          },
        },
      },
    });

    const outputText = response.output_text?.trim();
    if (!outputText) {
      throw new Error('AI returned an empty response.');
    }

    const parsed = emailSchema.parse(JSON.parse(outputText));

    return {
      subject: parsed.subject,
      body: parsed.body,
      strategy: 'ai',
    };
  } catch (error) {
    const fallback = buildFallbackEmailDraft(input);
    return {
      ...fallback,
      fallbackReason: error instanceof Error ? error.message : 'Unknown generation error.',
    };
  }
};
