'use client';

export type AuthBroadcastEvent =
  | { type: 'session-refreshed'; source: string; generation: number; accessToken: string }
  | { type: 'session-replaced'; source: string; generation: number }
  | { type: 'session-cleared'; source: string; generation: number };

export class AuthCoordinationUnavailableError extends Error {
  constructor() {
    super('This browser cannot safely coordinate refresh across tabs. Please sign in again.');
    this.name = 'AuthCoordinationUnavailableError';
  }
}

const CHANNEL_NAME = 'bookstore-auth';
const LOCK_NAME = 'bookstore-auth-session';

export class CrossTabAuthCoordinator {
  private readonly source = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  private readonly channel = typeof window === 'undefined' || typeof BroadcastChannel === 'undefined'
    ? null
    : new BroadcastChannel(CHANNEL_NAME);
  private revisionValue = 0;
  private readonly listeners = new Set<(event: AuthBroadcastEvent) => void>();

  constructor() {
    this.channel?.addEventListener('message', (message: MessageEvent<unknown>) => {
      const event = message.data;
      if (!this.isEvent(event) || event.source === this.source) return;
      this.revisionValue += 1;
      this.listeners.forEach((listener) => listener(event));
    });
  }

  get revision(): number { return this.revisionValue; }
  get canCoordinateRefresh(): boolean {
    return this.channel !== null && typeof navigator !== 'undefined' && Boolean(navigator.locks);
  }

  subscribe(listener: (event: AuthBroadcastEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  broadcast(type: AuthBroadcastEvent['type'], accessToken?: string): void {
    this.revisionValue += 1;
    const event = {
      type,
      source: this.source,
      generation: this.revisionValue,
      ...(type === 'session-refreshed' ? { accessToken } : {}),
    };
    if (!this.isEvent(event)) throw new TypeError('A refreshed session requires an access token.');
    this.channel?.postMessage(event);
  }

  async withSessionLock<T>(task: () => Promise<T>, required = true): Promise<T> {
    if (!this.canCoordinateRefresh) {
      if (required) throw new AuthCoordinationUnavailableError();
      return task();
    }
    return navigator.locks.request(LOCK_NAME, { mode: 'exclusive' }, task);
  }

  close(): void { this.channel?.close(); }

  private isEvent(value: unknown): value is AuthBroadcastEvent {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<AuthBroadcastEvent>;
    const common = typeof candidate.source === 'string' &&
      Number.isSafeInteger(candidate.generation) &&
      Number(candidate.generation) >= 0 &&
      ['session-refreshed', 'session-replaced', 'session-cleared'].includes(candidate.type ?? '');
    if (!common) return false;
    return candidate.type !== 'session-refreshed' ||
      ('accessToken' in candidate && typeof candidate.accessToken === 'string' && Boolean(candidate.accessToken));
  }
}

export const crossTabAuth = new CrossTabAuthCoordinator();
