import { randomUUID } from 'node:crypto';
import { recoverAdmin } from '../../operations/recover-admin';
import { setupAdmin } from '../../operations/setup-admin';
import { IdentityReaderService } from '../../src/modules/users/identity-reader.service';
import { UsersService } from '../../src/modules/users/users.service';
import { AdminPostgresFixture } from '../helpers/admin-postgres.fixture';

describe('Singleton admin PostgreSQL invariant', () => {
  const db = new AdminPostgresFixture();
  beforeAll(() => db.start(), 60_000);
  beforeEach(() => db.reset());
  afterAll(() => db.stop(), 30_000);

  it('allows concurrent setup to create exactly one admin', async () => {
    const input = async () => ({ email: db.email, displayName: 'Admin', password: db.password });
    const results = await Promise.all([
      setupAdmin(db.setup, db.passwords, input),
      setupAdmin(db.setupTwo, db.passwords, input),
    ]);
    expect(results.sort()).toEqual(['already_exists', 'created']);
    expect(await db.runtime.user.count()).toBe(1);
  });

  it('repeated setup neither reads a new secret nor overwrites credentials or session', async () => {
    await db.seed();
    await db.auth.login({ email: db.email, password: db.password });
    const before = await db.runtime.user.findUniqueOrThrow({ where: { singletonKey: 1 } });
    expect(await setupAdmin(db.setup, db.passwords, async () => { throw new Error('must not read secrets'); })).toBe('already_exists');
    expect(await db.runtime.user.findUniqueOrThrow({ where: { singletonKey: 1 } })).toEqual(before);
  });

  it('database CHECK rejects a second singleton value independently of application code', async () => {
    await db.seed();
    await expect(db.owner.query('INSERT INTO users (id,singleton_key,email,password_hash,display_name) VALUES ($1,2,$2,$3,$4)', [randomUUID(), 'second@example.test', 'hash', 'Second'])).rejects.toMatchObject({ code: '23514' });
    expect(await db.runtime.user.count()).toBe(1);
  });

  it('recovery atomically replaces the password, revokes the session and keeps one account', async () => {
    await db.seed();
    const session = await db.auth.login({ email: db.email, password: db.password });
    const nextPassword = 'a recovered integration password';
    await expect(recoverAdmin(
      new IdentityReaderService(db.recovery),
      new UsersService(db.recovery),
      db.passwords,
      async () => ({ password: nextPassword }),
    )).resolves.toBe('recovered');
    expect(await db.runtime.user.count()).toBe(1);
    expect(await db.runtime.user.findUniqueOrThrow({ where: { singletonKey: 1 } })).toMatchObject({ sessionId: null, refreshTokenHash: null, refreshGeneration: 0, sessionExpiresAt: null });
    expect((await db.profile(session.accessToken)).status).toBe(401);
    await expect(db.auth.login({ email: db.email, password: db.password })).rejects.toBeDefined();
    await expect(db.auth.login({ email: db.email, password: nextPassword })).resolves.toBeDefined();
  });

  it('recovery fails when no singleton exists and never falls back to setup', async () => {
    await expect(recoverAdmin(
      new IdentityReaderService(db.recovery),
      new UsersService(db.recovery),
      db.passwords,
      async () => ({ password: 'a recovery password that must not create' }),
    )).rejects.toBeDefined();
    expect(await db.runtime.user.count()).toBe(0);
  });
});
