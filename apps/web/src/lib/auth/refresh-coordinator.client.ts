'use client';

import { isAuthenticationFailure, normalizeApiError } from '../http/normalize-error';
import { getAuthTransport, type AuthTransport } from './auth-transport.client';
import {
  AuthCoordinationUnavailableError,
  crossTabAuth,
  type CrossTabAuthCoordinator,
} from './cross-tab.client';
import { sessionStore, type SessionStore } from './session-store.client';

export class RefreshCoordinator {
  private inFlight: Promise<string> | null = null;
  constructor(
    private readonly sessions: SessionStore,
    private readonly tabs: CrossTabAuthCoordinator,
    private readonly transport: () => AuthTransport,
  ) {}

  refresh(): Promise<string> {
    if (this.inFlight) return this.inFlight;
    const generation = this.sessions.getSnapshot().generation;
    const crossTabGeneration = this.tabs.revision;
    this.inFlight = this.tabs.withSessionLock(async () => {
      const current = this.sessions.getAccessToken();
      const localGenerationChanged = this.sessions.getSnapshot().generation !== generation;
      const crossTabGenerationChanged = this.tabs.revision !== crossTabGeneration;
      if (current && localGenerationChanged && crossTabGenerationChanged) return current;
      if (current && localGenerationChanged) return current;
      // A newer cross-tab generation means the shared HttpOnly cookie may have
      // rotated while this tab waited. Reading it only after lock acquisition
      // ensures the following request uses the browser's latest cookie value.
      try {
        const result = await this.transport().refresh();
        this.sessions.installAccessToken(result.accessToken);
        this.tabs.broadcast('session-refreshed', result.accessToken);
        return result.accessToken;
      } catch (error) {
        if (isAuthenticationFailure(error)) {
          this.sessions.clear('session-ended');
          this.tabs.broadcast('session-cleared');
        }
        throw normalizeApiError(error);
      }
    }).catch((error: unknown) => {
      if (error instanceof AuthCoordinationUnavailableError) {
        this.sessions.clear('coordination-unavailable');
      }
      throw error;
    }).finally(() => { this.inFlight = null; });
    return this.inFlight;
  }
}

export const refreshCoordinator = new RefreshCoordinator(sessionStore, crossTabAuth, getAuthTransport);
