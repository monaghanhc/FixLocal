import { describe, expect, it } from 'vitest';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders sent status label', () => {
    const tree = StatusBadge({ status: 'sent' });
    expect(JSON.stringify(tree)).toContain('Sent');
  });

  it('renders failed status label', () => {
    const tree = StatusBadge({ status: 'failed' });
    expect(JSON.stringify(tree)).toContain('Failed');
  });
});
