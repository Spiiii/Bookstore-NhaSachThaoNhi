import { describe, expect, it, vi } from 'vitest';
import type { AuthTransport } from './auth-transport.client';
import {
  AuthCoordinationUnavailableError,
  CrossTabAuthCoordinator,
} from './cross-tab.client';
import { RefreshCoordinator } from './refresh-coordinator.client';
import { SessionStore } from './session-store.client';

describe('RefreshCoordinator', () => {
  it('coalesces concurrent refresh calls within one tab', async () => {
    const sessions = new SessionStore();
    const tabs = new CrossTabAuthCoordinator();
    vi.spyOn(tabs, 'withSessionLock').mockImplementation(async (task) => task());
    vi.spyOn(tabs, 'broadcast').mockImplementation(() => undefined);
    const refresh = vi.fn().mockResolvedValue({ accessToken: 'new-token', tokenType: 'Bearer' });
    const coordinator = new RefreshCoordinator(
      sessions,
      tabs,
      () => ({ refresh }) as unknown as AuthTransport,
    );

    const first = coordinator.refresh();
    const second = coordinator.refresh();
    await expect(Promise.all([first, second])).resolves.toEqual(['new-token', 'new-token']);
    expect(refresh).toHaveBeenCalledOnce();
    tabs.close();
  });

  it('rechecks local generation after acquiring the browser lock', async () => {
    const sessions = new SessionStore();
    const tabs = new CrossTabAuthCoordinator();
    vi.spyOn(tabs, 'withSessionLock').mockImplementation(async (task) => {
      sessions.installAccessToken('already-rotated');
      return task();
    });
    const refresh = vi.fn();
    const coordinator = new RefreshCoordinator(
      sessions,
      tabs,
      () => ({ refresh }) as unknown as AuthTransport,
    );

    await expect(coordinator.refresh()).resolves.toBe('already-rotated');
    expect(refresh).not.toHaveBeenCalled();
    tabs.close();
  });

  it('fails closed when cross-tab locking is unavailable', async () => {
    const sessions = new SessionStore();
    const tabs = new CrossTabAuthCoordinator();
    vi.spyOn(tabs, 'withSessionLock').mockRejectedValue(new AuthCoordinationUnavailableError());
    const coordinator = new RefreshCoordinator(
      sessions,
      tabs,
      () => ({ refresh: vi.fn() }) as unknown as AuthTransport,
    );

    await expect(coordinator.refresh()).rejects.toBeInstanceOf(AuthCoordinationUnavailableError);
    expect(sessions.getSnapshot()).toMatchObject({
      status: 'anonymous',
      reason: 'coordination-unavailable',
    });
    tabs.close();
  });
});
