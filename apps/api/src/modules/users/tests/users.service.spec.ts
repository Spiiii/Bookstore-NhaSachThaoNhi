import { Prisma, Role } from '../../../generated/prisma/client';
import { PrismaModule } from '../../../infrastructure/prisma/prisma.module';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { IdentityReaderService } from '../identity-reader.service';
import { UsersModule } from '../users.module';
import { UsersService } from '../users.service';
import {
  AdminSessionRejectedError,
  AdminStateInvariantError,
  type AdminState,
} from '../types/admin-state.types';

const ADMIN = '11111111-1111-4111-8111-111111111111';
const SID = '22222222-2222-4222-8222-222222222222';
const NEXT_SID = '33333333-3333-4333-8333-333333333333';
// Encoded fixtures only; hashing and password verification are outside this unit suite.
const PASSWORD = '$argon2id$v=19$m=19456,t=2,p=1$' + 'A'.repeat(22) + '$' + 'B'.repeat(43);
const NEW_PASSWORD = PASSWORD.replace('B'.repeat(43), 'C'.repeat(43));
const HASH = 'a'.repeat(64);
const NEXT_HASH = 'b'.repeat(64);
const expected = { adminId: ADMIN, sessionId: SID, authVersion: 7 };
const credential = { adminId: ADMIN, authVersion: 7, passwordHash: PASSWORD };

function fixture(): AdminState {
  return {
    id: ADMIN,
    role: Role.ADMIN,
    passwordHash: PASSWORD,
    authVersion: 7,
    sessionId: SID,
    refreshTokenHash: HASH,
    refreshGeneration: 2,
    sessionExpiresAt: new Date(Date.now() + 3_600_000),
  };
}

// Protocol mock: asserts lock-before-read/write. It does NOT model PostgreSQL concurrency.
function harness(initial: AdminState | null = fixture()) {
  let state = initial;
  let locked = false;
  const tx = {
    $queryRaw: jest.fn(async (sql: TemplateStringsArray) => {
      expect(sql.join('')).toMatch(/WHERE "singleton_key" = 1 FOR UPDATE/);
      locked = true;
      return state ? [{ id: state.id }] : [];
    }),
    user: {
      findUnique: jest.fn(async () => {
        if (!locked) throw new Error('Read before singleton lock');
        return state ? { ...state } : null;
      }),
      update: jest.fn(
        async ({
          data,
          select,
        }: {
          data: Record<string, unknown>;
          select: Record<string, boolean>;
        }) => {
          if (!locked || !state) throw new Error('Write without a locked singleton');
          const next = { ...state } as unknown as Record<string, unknown>;
          for (const [key, value] of Object.entries(data)) {
            next[key] =
              typeof value === 'object' && value !== null && 'increment' in value
                ? Number(next[key]) + Number(value.increment)
                : value;
          }
          state = next as unknown as AdminState;
          return Object.fromEntries(Object.keys(select).map((key) => [key, next[key]]));
        },
      ),
    },
  };
  const prisma = {
    $transaction: jest.fn(async (work: (client: Prisma.TransactionClient) => Promise<unknown>) => {
      locked = false;
      return work(tx as unknown as Prisma.TransactionClient);
    }),
  };
  return {
    service: new UsersService(prisma as unknown as PrismaService),
    prisma,
    tx,
    client: tx as unknown as Prisma.TransactionClient,
    state: () => state,
  };
}

describe('Users singleton persistence protocol', () => {
  it('replaces a session only after rechecking the credential snapshot', async () => {
    const h = harness();
    const result = await h.service.replaceSession({
      expected: credential,
      sessionId: NEXT_SID,
      refreshTokenHash: NEXT_HASH,
      sessionExpiresAt: new Date(Date.now() + 60_000),
    });
    expect(result.status).toBe('updated');
    expect(h.state()).toMatchObject({
      authVersion: 8,
      sessionId: NEXT_SID,
      refreshGeneration: 0,
      refreshTokenHash: NEXT_HASH,
    });
    expect(result).not.toHaveProperty('value.passwordHash');
    expect(result).not.toHaveProperty('value.refreshTokenHash');
    expect(h.prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'ReadCommitted',
    });
  });

  it.each([
    { ...credential, authVersion: 6 },
    { ...credential, passwordHash: NEW_PASSWORD },
    { ...credential, adminId: NEXT_SID },
  ])('rejects stale login expectations without writes', async (snapshot) => {
    const h = harness();
    expect(
      await h.service.replaceSession({
        expected: snapshot,
        sessionId: NEXT_SID,
        refreshTokenHash: NEXT_HASH,
        sessionExpiresAt: new Date(Date.now() + 60_000),
      }),
    ).toEqual({ status: 'stale' });
    expect(h.tx.user.update).not.toHaveBeenCalled();
  });

  it('does not revive expired state during refresh', async () => {
    const h = harness({ ...fixture(), sessionExpiresAt: new Date(0) });
    expect(
      await h.service.rotateSession({
        expected,
        refreshGeneration: 2,
        refreshTokenHash: HASH,
        nextRefreshTokenHash: NEXT_HASH,
      }),
    ).toEqual({ status: 'expired' });
    expect(h.tx.user.update).not.toHaveBeenCalled();
  });

  it('rotates exactly one generation without extending the absolute session expiry', async () => {
    const h = harness();
    const expires = h.state()!.sessionExpiresAt;
    expect(
      (
        await h.service.rotateSession({
          expected,
          refreshGeneration: 2,
          refreshTokenHash: HASH,
          nextRefreshTokenHash: NEXT_HASH,
        })
      ).status,
    ).toBe('updated');
    expect(h.state()).toMatchObject({
      authVersion: 7,
      refreshGeneration: 3,
      refreshTokenHash: NEXT_HASH,
      sessionExpiresAt: expires,
    });
  });

  it('returns replayed after persisting revoke instead of throwing and rolling it back', async () => {
    const h = harness();
    expect(
      await h.service.rotateSession({
        expected,
        refreshGeneration: 1,
        refreshTokenHash: 'c'.repeat(64),
        nextRefreshTokenHash: NEXT_HASH,
      }),
    ).toEqual({ status: 'replayed' });
    expect(h.state()).toMatchObject({
      authVersion: 8,
      sessionId: null,
      refreshTokenHash: null,
      sessionExpiresAt: null,
      refreshGeneration: 0,
    });
  });

  it.each([
    { refreshGeneration: 3, refreshTokenHash: HASH },
    { refreshGeneration: 2, refreshTokenHash: 'c'.repeat(64) },
  ])(
    'rejects future generation or hash mismatch without revoking a valid session',
    async (claims) => {
      const h = harness();
      expect(
        await h.service.rotateSession({ expected, ...claims, nextRefreshTokenHash: NEXT_HASH }),
      ).toEqual({ status: 'stale' });
      expect(h.tx.user.update).not.toHaveBeenCalled();
    },
  );

  it('old logout/refresh cannot revoke a newly committed login', async () => {
    const h = harness({ ...fixture(), authVersion: 8, sessionId: NEXT_SID, refreshGeneration: 0 });
    expect(await h.service.revokeSession(expected)).toEqual({ status: 'unchanged' });
    expect(
      await h.service.rotateSession({
        expected,
        refreshGeneration: 1,
        refreshTokenHash: HASH,
        nextRefreshTokenHash: NEXT_HASH,
      }),
    ).toEqual({ status: 'stale' });
    expect(h.tx.user.update).not.toHaveBeenCalled();
  });

  it('logout clears every session field and becomes idempotent', async () => {
    const h = harness();
    expect((await h.service.revokeSession(expected)).status).toBe('updated');
    expect(await h.service.revokeSession(expected)).toEqual({ status: 'unchanged' });
    expect(h.state()).toMatchObject({
      authVersion: 8,
      sessionId: null,
      refreshGeneration: 0,
      refreshTokenHash: null,
      sessionExpiresAt: null,
    });
  });

  it('password replacement requires the verified hash snapshot and current session', async () => {
    const h = harness();
    expect(
      await h.service.replacePassword({
        expected,
        expectedPasswordHash: NEW_PASSWORD,
        newPasswordHash: NEW_PASSWORD,
      }),
    ).toEqual({ status: 'stale' });
    expect(
      (
        await h.service.replacePassword({
          expected,
          expectedPasswordHash: PASSWORD,
          newPasswordHash: NEW_PASSWORD,
        })
      ).status,
    ).toBe('updated');
    expect(h.state()).toMatchObject({
      passwordHash: NEW_PASSWORD,
      authVersion: 8,
      sessionId: null,
      refreshTokenHash: null,
      refreshGeneration: 0,
      sessionExpiresAt: null,
    });
  });

  it('operational recovery revokes credentials without requiring an active session', async () => {
    const h = harness({
      ...fixture(),
      sessionId: null,
      refreshTokenHash: null,
      sessionExpiresAt: null,
      refreshGeneration: 0,
    });
    expect(
      (await h.service.recoverPassword({ expected: credential, newPasswordHash: NEW_PASSWORD }))
        .status,
    ).toBe('updated');
    expect(h.state()).toMatchObject({
      passwordHash: NEW_PASSWORD,
      authVersion: 8,
      sessionId: null,
    });
  });

  it('missing singleton never becomes implicit setup', async () => {
    const h = harness(null);
    expect(
      await h.service.recoverPassword({ expected: credential, newPasswordHash: NEW_PASSWORD }),
    ).toEqual({ status: 'not_found' });
    expect(h.tx.user.update).not.toHaveBeenCalled();
  });

  it('uses an outer transaction directly and throws on stale content-mutation state', async () => {
    const h = harness();
    await h.service.assertCurrentSession(h.client, expected);
    await expect(
      h.service.assertCurrentSession(h.client, { ...expected, authVersion: 6 }),
    ).rejects.toBeInstanceOf(AdminSessionRejectedError);
    await h.service.revokeSession(expected, h.client);
    expect(h.prisma.$transaction).not.toHaveBeenCalled();
  });

  it('fails closed on partial persisted session state', async () => {
    const h = harness({ ...fixture(), refreshTokenHash: null });
    await expect(h.service.revokeSession(expected)).rejects.toBeInstanceOf(
      AdminStateInvariantError,
    );
    expect(h.tx.user.update).not.toHaveBeenCalled();
  });

  it('does not wrap an exhausted PostgreSQL integer counter', async () => {
    const h = harness({ ...fixture(), authVersion: 2_147_483_647 });
    await expect(
      h.service.revokeSession({ ...expected, authVersion: 2_147_483_647 }),
    ).rejects.toThrow(RangeError);
    expect(h.tx.user.update).not.toHaveBeenCalled();
  });

  it('propagates database failures instead of returning an authenticated result', async () => {
    const h = harness();
    h.tx.$queryRaw.mockRejectedValueOnce(new Error('Database unavailable'));
    await expect(h.service.revokeSession(expected)).rejects.toThrow('Database unavailable');
  });

  it('validates prepared hashes before acquiring a transaction', async () => {
    const h = harness();
    await expect(
      h.service.recoverPassword({ expected: credential, newPasswordHash: 'plaintext' }),
    ).rejects.toThrow(TypeError);
    expect(h.prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('Users read surface and module boundaries', () => {
  it('reads guard identity without selecting password or refresh hashes and without caching', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const reader = new IdentityReaderService({ user: { findUnique } } as unknown as PrismaService);
    await reader.readCurrentIdentity();
    await reader.readCurrentIdentity();
    expect(findUnique).toHaveBeenCalledTimes(2);
    const select = findUnique.mock.calls[0]![0].select;
    expect(select).not.toHaveProperty('passwordHash');
    expect(select).not.toHaveProperty('refreshTokenHash');
  });

  it('canonicalizes email while restricting credential lookup to the singleton', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const reader = new IdentityReaderService({ user: { findUnique } } as unknown as PrismaService);
    await reader.findLoginCredential('  ADMIN+Tag@Example.com  ');
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { singletonKey: 1, email: 'admin+tag@example.com' },
      }),
    );
  });

  it('has no controller, global scope, or PrismaService re-export', () => {
    expect(Reflect.getMetadata('controllers', UsersModule) ?? []).toEqual([]);
    expect(Reflect.getMetadata('__module:global__', UsersModule)).not.toBe(true);
    expect(Reflect.getMetadata('imports', UsersModule)).toEqual([PrismaModule]);
    expect(Reflect.getMetadata('exports', UsersModule)).toEqual([
      UsersService,
      IdentityReaderService,
    ]);
  });
});
