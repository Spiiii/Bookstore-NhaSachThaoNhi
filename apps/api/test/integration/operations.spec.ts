import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { assertOperationalDatabase, requirePassword } from '../../operations/bootstrap';
import { validateOperationEnvironment } from '../../operations/config/environment.validation';
import { OperationalModule } from '../../operations/operational.module';
import { recoverAdmin } from '../../operations/recover-admin';
import { setupAdmin } from '../../operations/setup-admin';
import { PasswordService } from '../../src/infrastructure/credentials/password.service';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { IdentityReaderService } from '../../src/modules/users/identity-reader.service';
import { UsersService } from '../../src/modules/users/users.service';

describe('Operational entry points (persistence doubles)', () => {
  const hash =
    '$argon2id$v=19$m=65536,t=3,p=1$abcdefghijklmnopqrstuv$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ';
  const findUnique = jest.fn();
  const create = jest.fn();
  const hashPassword = jest.fn();
  const readInput = jest.fn();
  const recoverPassword = jest.fn();
  const readCurrentIdentity = jest.fn();
  const findLoginCredential = jest.fn();
  const prisma = { user: { findUnique, create } } as unknown as PrismaService;
  const passwords = { hash: hashPassword } as unknown as PasswordService;
  const users = { recoverPassword } as unknown as UsersService;
  const identities = {
    readCurrentIdentity,
    findLoginCredential,
  } as unknown as IdentityReaderService;

  beforeEach(() => {
    jest.resetAllMocks();
    hashPassword.mockResolvedValue(hash);
  });

  it('setup with an existing singleton reads no secrets and writes nothing', async () => {
    findUnique.mockResolvedValue({ id: 'existing' });
    expect(await setupAdmin(prisma, passwords, readInput)).toBe('already_exists');
    expect(readInput).not.toHaveBeenCalled();
    expect(hashPassword).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('setup inserts only a normalized singleton with a prepared hash', async () => {
    findUnique.mockResolvedValue(null);
    const input = {
      email: ' ADMIN@example.test ',
      displayName: ' Admin ',
      password: 'a long secret password',
    };
    readInput.mockResolvedValue(input);
    create.mockResolvedValue({ id: 'created' });
    expect(await setupAdmin(prisma, passwords, readInput)).toBe('created');
    expect(create).toHaveBeenCalledWith({
      data: {
        singletonKey: 1,
        email: 'admin@example.test',
        displayName: 'Admin',
        passwordHash: hash,
        role: 'ADMIN',
      },
      select: { id: true },
    });
    expect(input).toEqual({});
  });

  it('a unique conflict is a no-op only after confirming the singleton winner', async () => {
    findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'winner' });
    readInput.mockImplementation(async () => ({
      email: 'admin@example.test',
      displayName: 'Admin',
      password: 'a long secret password',
    }));
    create.mockRejectedValue({ code: 'P2002' });
    expect(await setupAdmin(prisma, passwords, readInput)).toBe('already_exists');
    findUnique.mockResolvedValue(null);
    await expect(setupAdmin(prisma, passwords, readInput)).rejects.toEqual({ code: 'P2002' });
  });

  it('setup propagates permission failure without pretending it was idempotent', async () => {
    findUnique.mockResolvedValue(null);
    readInput.mockResolvedValue({
      email: 'admin@example.test',
      displayName: 'Admin',
      password: 'a long secret password',
    });
    create.mockRejectedValue(new Error('permission denied'));
    await expect(setupAdmin(prisma, passwords, readInput)).rejects.toThrow('permission denied');
    expect(findUnique).toHaveBeenCalledTimes(1);
  });

  it('recovery fails before reading secrets when there is no account', async () => {
    readCurrentIdentity.mockResolvedValue(null);
    await expect(recoverAdmin(identities, users, passwords, readInput)).rejects.toThrow(
      'never creates',
    );
    expect(readInput).not.toHaveBeenCalled();
    expect(recoverPassword).not.toHaveBeenCalled();
  });

  it('recovery delegates hash replacement and revocation to the atomic Users primitive', async () => {
    readCurrentIdentity.mockResolvedValue({ id: 'admin', email: 'admin@example.test' });
    findLoginCredential.mockResolvedValue({
      id: 'admin',
      role: 'ADMIN',
      authVersion: 7,
      passwordHash: 'old-hash',
    });
    const input = { password: 'a long replacement password' };
    readInput.mockResolvedValue(input);
    recoverPassword.mockResolvedValue({ status: 'updated' });
    expect(await recoverAdmin(identities, users, passwords, readInput)).toBe('recovered');
    expect(recoverPassword).toHaveBeenCalledWith({
      expected: { adminId: 'admin', authVersion: 7, passwordHash: 'old-hash' },
      newPasswordHash: hash,
    });
    expect(input).toEqual({});
  });

  it('recovery does not retry a stale credential snapshot or claim success', async () => {
    readCurrentIdentity.mockResolvedValue({ id: 'admin', email: 'admin@example.test' });
    findLoginCredential.mockResolvedValue({
      id: 'admin',
      role: 'ADMIN',
      authVersion: 7,
      passwordHash: 'old-hash',
    });
    readInput.mockResolvedValue({ password: 'a long replacement password' });
    recoverPassword.mockResolvedValue({ status: 'stale' });
    await expect(recoverAdmin(identities, users, passwords, readInput)).rejects.toThrow(
      'did not commit',
    );
    expect(recoverPassword).toHaveBeenCalledTimes(1);
  });

  it('requires mode-specific credentials, explicit role and operator attribution', () => {
    const env = {
      SETUP_DATABASE_URL: 'postgresql://setup:secret@localhost/bookstore',
      SETUP_DATABASE_ROLE: 'setup',
      OPERATOR_ID: 'operator@example.test',
    };
    expect(validateOperationEnvironment('setup', env).databaseRole).toBe('setup');
    expect(() => validateOperationEnvironment('recovery', env)).toThrow();
    expect(() =>
      validateOperationEnvironment('setup', { DATABASE_URL: env.SETUP_DATABASE_URL }),
    ).toThrow();
    expect(() => validateOperationEnvironment('setup', { ...env, OPERATOR_ID: '' })).toThrow();
    expect(() => requirePassword('short')).toThrow();
    expect(() => requirePassword('😀'.repeat(300))).toThrow();
  });

  it('preflight refuses missing singleton CHECK, owner and unexpected privilege grants', async () => {
    const allowed = {
      role: 'setup',
      login: 'setup',
      unsafe: false,
      can_select: true,
      can_insert: true,
      can_delete: false,
      can_truncate: false,
      can_update: false,
      can_update_any: false,
      can_update_protected: false,
      can_recover: false,
      singleton_check: true,
    };
    const query = jest.fn().mockResolvedValue([allowed]);
    const db = { $queryRaw: query } as unknown as PrismaService;
    await expect(assertOperationalDatabase(db, 'setup', 'setup')).resolves.toBeUndefined();
    for (const patch of [
      { singleton_check: false },
      { unsafe: true },
      { can_update_any: true },
      { role: 'owner' },
    ]) {
      query.mockResolvedValue([{ ...allowed, ...patch }]);
      await expect(assertOperationalDatabase(db, 'setup', 'setup')).rejects.toThrow(
        'preflight failed',
      );
    }
    query.mockResolvedValue([
      { ...allowed, can_insert: false, can_update_any: true, can_recover: true },
    ]);
    await expect(assertOperationalDatabase(db, 'recovery', 'setup')).resolves.toBeUndefined();
  });

  it('creates a controller-free context with shared Users/Password/Prisma and closes it', async () => {
    const disconnected = jest.fn();
    const context = await Test.createTestingModule({ imports: [OperationalModule] })
      .overrideProvider(PrismaService)
      .useValue({ onModuleDestroy: disconnected })
      .overrideProvider(ConfigService)
      .useValue(new ConfigService({}))
      .compile();
    await context.init();
    expect(Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, OperationalModule) ?? []).toEqual([]);
    expect(context.get(UsersService)).toBeInstanceOf(UsersService);
    expect(context.get(IdentityReaderService)).toBeInstanceOf(IdentityReaderService);
    expect(context.get(PasswordService)).toBeInstanceOf(PasswordService);
    await context.close();
    expect(disconnected).toHaveBeenCalledTimes(1);
  });
});
