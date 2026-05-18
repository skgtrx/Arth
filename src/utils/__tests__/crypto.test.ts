import { describe, it, expect } from 'vitest';
import { hashPin } from '../crypto';

describe('hashPin', () => {
  it('returns a 64-character hex string', async () => {
    const hash = await hashPin('1234');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns consistent hash for same input', async () => {
    const h1 = await hashPin('1234');
    const h2 = await hashPin('1234');
    expect(h1).toBe(h2);
  });

  it('returns different hash for different input', async () => {
    const h1 = await hashPin('1234');
    const h2 = await hashPin('5678');
    expect(h1).not.toBe(h2);
  });
});
