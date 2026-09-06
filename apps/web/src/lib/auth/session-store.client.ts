'use client';

import type { components } from '@bookstore/contracts';

export type AdminProfile = components['schemas']['AdminProfileDto'];
export type AuthStatus = 'initializing' | 'authenticated' | 'anonymous' | 'error';
export type AuthReason =
  | 'signed-out'
  | 'password-changed'
  | 'session-ended'
  | 'logout-unconfirmed'
  | 'coordination-unavailable'
  | 'configuration';

export interface SessionSnapshot {
  readonly status: AuthStatus;
  readonly profile: AdminProfile | null;
  readonly reason: AuthReason | null;
  readonly generation: number;
}

const SERVER_SNAPSHOT: SessionSnapshot = Object.freeze({
  status: 'initializing', profile: null, reason: null, generation: 0,
});

export class SessionStore {
  private accessToken: string | null = null;
  private snapshot: SessionSnapshot = SERVER_SNAPSHOT;
  private readonly listeners = new Set<() => void>();
  private readonly invalidationListeners = new Set<(reason: AuthReason) => void>();

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getSnapshot = (): SessionSnapshot => this.snapshot;
  readonly getServerSnapshot = (): SessionSnapshot => SERVER_SNAPSHOT;
  getAccessToken(): string | null { return this.accessToken; }

  onInvalidated(listener: (reason: AuthReason) => void): () => void {
    this.invalidationListeners.add(listener);
    return () => this.invalidationListeners.delete(listener);
  }

  installAccessToken(token: string): void {
    if (!token.trim()) throw new TypeError('Access token must not be empty');
    this.accessToken = token;
    this.update({
      ...this.snapshot,
      status: this.snapshot.profile ? 'authenticated' : 'initializing',
      reason: null,
    });
  }

  authenticate(profile: AdminProfile): void {
    if (!this.accessToken) throw new Error('Cannot authenticate without an access token');
    this.update({
      ...this.snapshot,
      status: 'authenticated',
      profile: Object.freeze({ ...profile }),
      reason: null,
    });
  }

  clear(reason: AuthReason = 'session-ended'): void {
    if (
      !this.accessToken &&
      this.snapshot.status === 'anonymous' &&
      this.snapshot.reason === reason
    ) return;
    this.accessToken = null;
    this.update({ ...this.snapshot, status: 'anonymous', profile: null, reason });
    this.invalidationListeners.forEach((listener) => listener(reason));
  }

  fail(reason: Extract<AuthReason, 'configuration'>): void {
    this.accessToken = null;
    this.update({ ...this.snapshot, status: 'error', profile: null, reason });
  }

  private update(next: Omit<SessionSnapshot, 'generation'> & { generation?: number }): void {
    this.snapshot = Object.freeze({ ...next, generation: this.snapshot.generation + 1 });
    this.listeners.forEach((listener) => listener());
  }
}

export const sessionStore = new SessionStore();
