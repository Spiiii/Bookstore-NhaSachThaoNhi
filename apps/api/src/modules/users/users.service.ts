import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  assertAdminState,
  assertCounter,
  assertPasswordHash,
  assertRefreshHash,
  assertSessionExpectation,
  assertUuid,
  isExpired,
  matchesRefreshHash,
  matchesSession,
  replacedPasswordData,
  replacedSessionData,
  revokedSessionData,
  rotatedSessionData,
} from './admin-state.rules';
import {
  AdminSessionRejectedError,
  SESSION_COMMIT_SELECT,
  type AdminState,
  type CredentialExpectation,
  type MutationResult,
  type PasswordRecovery,
  type PasswordReplacement,
  type RefreshRotation,
  type SessionCommit,
  type SessionExpectation,
  type SessionReplacement,
} from './types/admin-state.types';

const STATE_SELECT = {
  ...SESSION_COMMIT_SELECT,
  role: true,
  passwordHash: true,
  refreshTokenHash: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async replaceSession(
    input: SessionReplacement,
    tx?: Prisma.TransactionClient,
  ): Promise<MutationResult> {
    this.assertCredential(input.expected);
    assertUuid(input.sessionId);
    assertRefreshHash(input.refreshTokenHash);
    if (
      !(input.sessionExpiresAt instanceof Date) ||
      !Number.isFinite(input.sessionExpiresAt.getTime())
    ) {
      throw new TypeError('Session expiry must be a valid Date.');
    }
    return this.transact(tx, async (client) => {
      const state = await this.lockAdmin(client);
      if (!state) return { status: 'not_found' };
      if (!this.matchesCredential(state, input.expected)) return { status: 'stale' };
      const now = new Date();
      if (input.sessionExpiresAt.getTime() <= now.getTime()) return { status: 'expired' };
      if (input.sessionId === state.sessionId)
        throw new TypeError('A new login requires a new session ID.');
      return this.update(client, state, replacedSessionData(state, input, now));
    });
  }

  async rotateSession(
    input: RefreshRotation,
    tx?: Prisma.TransactionClient,
  ): Promise<MutationResult> {
    assertSessionExpectation(input.expected);
    assertCounter(input.refreshGeneration);
    assertRefreshHash(input.refreshTokenHash);
    assertRefreshHash(input.nextRefreshTokenHash);
    return this.transact(tx, async (client) => {
      const state = await this.lockAdmin(client);
      if (!state) return { status: 'not_found' };
      if (!matchesSession(state, input.expected)) return { status: 'stale' };
      if (isExpired(state, new Date())) return { status: 'expired' };
      // A verified older generation in THIS session is replay. Commit the revoke before returning.
      if (input.refreshGeneration < state.refreshGeneration) {
        await this.update(client, state, revokedSessionData(state));
        return { status: 'replayed' };
      }
      if (
        input.refreshGeneration !== state.refreshGeneration ||
        !matchesRefreshHash(state.refreshTokenHash!, input.refreshTokenHash)
      )
        return { status: 'stale' };
      if (input.nextRefreshTokenHash === input.refreshTokenHash) {
        throw new TypeError('Rotation requires a new refresh token digest.');
      }
      return this.update(client, state, rotatedSessionData(state, input.nextRefreshTokenHash));
    });
  }

  async revokeSession(
    expected: SessionExpectation,
    tx?: Prisma.TransactionClient,
  ): Promise<MutationResult> {
    assertSessionExpectation(expected);
    return this.transact(tx, async (client) => {
      const state = await this.lockAdmin(client);
      if (!state || !matchesSession(state, expected)) return { status: 'unchanged' };
      return this.update(client, state, revokedSessionData(state));
    });
  }

  async replacePassword(
    input: PasswordReplacement,
    tx?: Prisma.TransactionClient,
  ): Promise<MutationResult> {
    assertSessionExpectation(input.expected);
    assertPasswordHash(input.expectedPasswordHash);
    assertPasswordHash(input.newPasswordHash);
    return this.transact(tx, async (client) => {
      const state = await this.lockAdmin(client);
      if (!state) return { status: 'not_found' };
      if (
        !matchesSession(state, input.expected) ||
        state.passwordHash !== input.expectedPasswordHash
      ) {
        return { status: 'stale' };
      }
      if (isExpired(state, new Date())) return { status: 'expired' };
      return this.update(client, state, replacedPasswordData(state, input.newPasswordHash));
    });
  }

  /** Operational recovery only: no account creation, deletion or implicit setup fallback. */
  async recoverPassword(
    input: PasswordRecovery,
    tx?: Prisma.TransactionClient,
  ): Promise<MutationResult> {
    this.assertCredential(input.expected);
    assertPasswordHash(input.newPasswordHash);
    return this.transact(tx, async (client) => {
      const state = await this.lockAdmin(client);
      if (!state) return { status: 'not_found' };
      if (!this.matchesCredential(state, input.expected)) return { status: 'stale' };
      return this.update(client, state, replacedPasswordData(state, input.newPasswordHash));
    });
  }

  /** Call first inside a content mutation's transaction; the row lock lasts until its commit. */
  async assertCurrentSession(
    tx: Prisma.TransactionClient,
    expected: SessionExpectation,
  ): Promise<void> {
    assertSessionExpectation(expected);
    const state = await this.lockAdmin(tx);
    if (!state || !matchesSession(state, expected) || isExpired(state, new Date())) {
      throw new AdminSessionRejectedError();
    }
  }

  private transact<T>(
    tx: Prisma.TransactionClient | undefined,
    work: (client: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return tx
      ? work(tx)
      : this.prisma.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        });
  }

  private async lockAdmin(tx: Prisma.TransactionClient): Promise<AdminState | null> {
    // Lock order is singleton first, then any product/content rows owned by the outer caller.
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "users" WHERE "singleton_key" = 1 FOR UPDATE
    `;
    if (!rows[0]) return null;
    const state = await tx.user.findUnique({ where: { id: rows[0].id }, select: STATE_SELECT });
    if (state) assertAdminState(state);
    return state;
  }

  private assertCredential(expected: CredentialExpectation): void {
    assertUuid(expected.adminId);
    assertCounter(expected.authVersion);
    assertPasswordHash(expected.passwordHash);
  }

  private matchesCredential(state: AdminState, expected: CredentialExpectation): boolean {
    return (
      state.id === expected.adminId &&
      state.authVersion === expected.authVersion &&
      state.passwordHash === expected.passwordHash
    );
  }

  private async update(
    tx: Prisma.TransactionClient,
    state: AdminState,
    data: Prisma.UserUpdateInput,
  ): Promise<MutationResult> {
    const value: SessionCommit = await tx.user.update({
      where: { id: state.id },
      data,
      select: SESSION_COMMIT_SELECT,
    });
    return { status: 'updated', value };
  }
}
