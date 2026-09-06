import { timingSafeEqual } from 'node:crypto';
import { Prisma, Role } from '../../generated/prisma/client';
import {
  AdminStateInvariantError,
  type AdminState,
  type SessionExpectation,
  type SessionReplacement,
} from './types/admin-state.types';

const MAX_COUNTER = 2_147_483_647;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const REFRESH_HASH = /^[0-9a-f]{64}$/;
const PASSWORD_HASH =
  /^\$argon2id\$v=19\$([mtp]=[1-9]\d*(?:,[mtp]=[1-9]\d*){2})\$[A-Za-z0-9+/]{11,86}\$[A-Za-z0-9+/]{22,86}$/;

export function assertUuid(value: string): void {
  if (typeof value !== 'string' || value.length !== 36 || !UUID.test(value)) {
    throw new TypeError('Expected a canonical UUID v4.');
  }
}

export function assertCounter(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > MAX_COUNTER) {
    throw new RangeError('Admin counter is outside the supported integer range.');
  }
}

export function assertRefreshHash(value: string): void {
  if (typeof value !== 'string' || value.length !== 64 || !REFRESH_HASH.test(value)) {
    throw new TypeError('Expected a lowercase SHA-256 refresh-token digest.');
  }
}

export function assertPasswordHash(value: string): void {
  const match = typeof value === 'string' && value.length <= 255 ? PASSWORD_HASH.exec(value) : null;
  if (
    !match?.[1] ||
    match[0] !== value ||
    new Set(match[1].split(',').map((entry) => entry[0])).size !== 3
  ) {
    throw new TypeError('Expected an encoded Argon2id password hash.');
  }
}

export function assertSessionExpectation(expected: SessionExpectation): void {
  assertUuid(expected.adminId);
  assertUuid(expected.sessionId);
  assertCounter(expected.authVersion);
}

export function assertAdminState(state: AdminState): void {
  const empty =
    state.sessionId === null && state.refreshTokenHash === null && state.sessionExpiresAt === null;
  const full =
    state.sessionId !== null && state.refreshTokenHash !== null && state.sessionExpiresAt !== null;
  if (state.role !== Role.ADMIN || (!empty && !full) || (empty && state.refreshGeneration !== 0)) {
    throw new AdminStateInvariantError();
  }
  try {
    assertCounter(state.authVersion);
    assertCounter(state.refreshGeneration);
    if (full) {
      assertUuid(state.sessionId!);
      assertRefreshHash(state.refreshTokenHash!);
      if (!Number.isFinite(state.sessionExpiresAt!.getTime())) throw new AdminStateInvariantError();
    }
  } catch {
    throw new AdminStateInvariantError();
  }
}

export function matchesSession(state: AdminState, expected: SessionExpectation): boolean {
  return (
    state.id === expected.adminId &&
    state.authVersion === expected.authVersion &&
    state.sessionId === expected.sessionId
  );
}

export function isExpired(state: AdminState, now: Date): boolean {
  return state.sessionExpiresAt === null || state.sessionExpiresAt.getTime() <= now.getTime();
}

export function matchesRefreshHash(actual: string, expected: string): boolean {
  return timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

export function incrementCounter(value: number): Prisma.IntFieldUpdateOperationsInput {
  assertCounter(value);
  if (value === MAX_COUNTER) throw new RangeError('Admin counter exhausted; refusing to wrap.');
  return { increment: 1 };
}

export function revokedSessionData(state: AdminState): Prisma.UserUpdateInput {
  return {
    authVersion: incrementCounter(state.authVersion),
    sessionId: null,
    refreshTokenHash: null,
    sessionExpiresAt: null,
    refreshGeneration: 0,
  };
}

export function replacedPasswordData(
  state: AdminState,
  passwordHash: string,
): Prisma.UserUpdateInput {
  return { ...revokedSessionData(state), passwordHash };
}

export function replacedSessionData(
  state: AdminState,
  input: SessionReplacement,
  now: Date,
): Prisma.UserUpdateInput {
  return {
    authVersion: incrementCounter(state.authVersion),
    sessionId: input.sessionId,
    refreshTokenHash: input.refreshTokenHash,
    refreshGeneration: 0,
    sessionExpiresAt: input.sessionExpiresAt,
    lastLoginAt: now,
  };
}

export function rotatedSessionData(
  state: AdminState,
  refreshTokenHash: string,
): Prisma.UserUpdateInput {
  return { refreshGeneration: incrementCounter(state.refreshGeneration), refreshTokenHash };
}
