import { describe, expect, it } from 'vitest';
import {
  buildFallbackEmailDraft,
  generateEmailDraft,
  type EmailDraftInput,
} from '../src/services/emailDraft.js';

const baseInput: EmailDraftInput = {
  issueType: 'Pothole',
  notes: 'Large pothole near the bus stop.',
  photoCount: 2,
  authority: {
    name: 'City Public Works',
    email: 'publicworks@example.gov',
    phone: null,
    source: 'exact',
  },
  location: {
    latitude: 34.05,
    longitude: -118.24,
    city: 'Los Angeles',
    state: 'CA',
    zip: '90012',
    formattedAddress: '200 N Spring St, Los Angeles, CA 90012',
  },
};

describe('email draft generation', () => {
  it('returns fallback when AI client errors', async () => {
    const result = await generateEmailDraft(baseInput, {
      client: {
        responses: {
          create: async () => {
            throw new Error('intentional failure');
          },
        },
      },
    });

    expect(result.strategy).toBe('fallback');
    expect(result.fallbackReason).toContain('intentional failure');
    expect(result.subject).toContain('Pothole');
  });

  it('buildFallbackEmailDraft always returns a usable template', () => {
    const fallback = buildFallbackEmailDraft(baseInput);

    expect(fallback.strategy).toBe('fallback');
    expect(fallback.body).toContain('Issue type: Pothole');
    expect(fallback.body).toContain('Coordinates');
    expect(fallback.subject.length).toBeGreaterThan(10);
  });
});
