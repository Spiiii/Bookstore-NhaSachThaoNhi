import type { Prisma, User } from '../../../generated/prisma/client';

export type AdminState = Pick<
  User,
  | 'id'
  | 'role'
  | 'passwordHash'
  | 'authVersion'
  | 'sessionId'
  | 'refreshTokenHash'
  | 'refreshGeneration'
  | 'sessionExpiresAt'
>;

export interface SessionExpectation {
  readonly adminId: string;
  readonly sessionId: string;
  readonly authVersion: number;
}

export interface CredentialExpectation {
  readonly adminId: string;
  readonly authVersion: number;
  readonly passwordHash: string;
}

export interface SessionReplacement {
  readonly expected: CredentialExpectation;
  readonly sessionId: string;
  readonly refreshTokenHash: string;
  readonly sessionExpiresAt: Date;
}

/** Caller must verify JWT signature, purpose, audience and expiry before invoking rotation. */
export interface RefreshRotation {
  readonly expected: SessionExpectation;
  readonly refreshGeneration: number;
  readonly refreshTokenHash: string;
  readonly nextRefreshTokenHash: string;
}

export interface PasswordReplacement {
  readonly expected: SessionExpectation;
  readonly expectedPasswordHash: string;
  readonly newPasswordHash: string;
}

/** Only the independently authorized operational recovery command may use this input. */
export interface PasswordRecovery {
  readonly expected: CredentialExpectation;
  readonly newPasswordHash: string;
}

export const SESSION_COMMIT_SELECT = {
  id: true,
  authVersion: true,
  sessionId: true,
  refreshGeneration: true,
  sessionExpiresAt: true,
} satisfies Prisma.UserSelect;

export type SessionCommit = Prisma.UserGetPayload<{ select: typeof SESSION_COMMIT_SELECT }>;
export type MutationResult =
  | { readonly status: 'updated'; readonly value: SessionCommit }
  | { readonly status: 'not_found' | 'stale' | 'expired' | 'unchanged' | 'replayed' };

export class AdminStateInvariantError extends Error {
  constructor() {
    super('Invalid persisted admin state.');
    this.name = 'AdminStateInvariantError';
  }
}

export class AdminSessionRejectedError extends Error {
  constructor() {
    super('Admin session is no longer current.');
    this.name = 'AdminSessionRejectedError';
  }
}
