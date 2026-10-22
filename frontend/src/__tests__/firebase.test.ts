import { describe, it, expect, vi, afterEach } from 'vitest';

describe('firebase config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('does not throw and leaves auth null without an API key', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    const mod = await import('../lib/firebase');
    expect(mod.isFirebaseConfigured).toBe(false);
    expect(mod.auth).toBeNull();
  });
});
