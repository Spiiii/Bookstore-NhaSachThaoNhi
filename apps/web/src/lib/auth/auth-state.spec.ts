import type { components } from '@bookstore/contracts';
import { describe, expect, it, vi } from 'vitest';
import { SessionStore } from './session-store.client';

const profile: components['schemas']['AdminProfileDto'] = {
  id: 'd69c0385-5963-4b58-a1cf-540b09ea48e2',
  email: 'admin@example.com',
  displayName: 'Admin',
  role: 'ADMIN',
};

describe('SessionStore', () => {
  it('keeps the access token outside the public snapshot', () => {
    const store = new SessionStore();
    store.installAccessToken('memory-only-token');
    store.authenticate(profile);

    expect(store.getAccessToken()).toBe('memory-only-token');
    expect(store.getSnapshot()).toMatchObject({ status: 'authenticated', profile });
    expect(JSON.stringify(store.getSnapshot())).not.toContain('memory-only-token');
  });

  it('removes credentials when the session is cleared', () => {
    const store = new SessionStore();
    store.installAccessToken('token');
    store.authenticate(profile);
    store.clear('signed-out');

    expect(store.getAccessToken()).toBeNull();
    expect(store.getSnapshot()).toMatchObject({ status: 'anonymous', profile: null, reason: 'signed-out' });
  });

  it('runs invalidation cleanup synchronously', () => {
    const store = new SessionStore();
    const cleanup = vi.fn();
    store.onInvalidated(cleanup);
    store.installAccessToken('token');

    store.clear('session-ended');

    expect(cleanup).toHaveBeenCalledWith('session-ended');
  });
});
