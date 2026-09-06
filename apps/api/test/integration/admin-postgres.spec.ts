import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { setupAdmin } from '../../operations/setup-admin';
import { assertOperationalDatabase } from '../../operations/bootstrap';
import { PasswordService } from '../../src/infrastructure/credentials/password.service';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { AuthService } from '../../src/modules/auth/auth.service';
import { UsersService } from '../../src/modules/users/users.service';
import { IdentityReaderService } from '../../src/modules/users/identity-reader.service';
import { recoverAdmin } from '../../operations/recover-admin';

/** Real PostgreSQL only. Uses a newly created database and dedicated temporary roles. Never a schema in an existing DB. */
describe('Admin PostgreSQL deployment gate', () => {
  const suffix = randomBytes(6).toString('hex');
  const database = `bookstore_test_${suffix}`;
  const names = {
    runtime: `bs_runtime_${suffix}`,
    setup: `bs_setup_${suffix}`,
    recovery: `bs_recovery_${suffix}`,
  };
  const secret = randomBytes(32).toString('hex');
  const email = 'admin@example.test';
  const password = 'a long initial test password';
  let admin: Client;
  let owner: Client;
  let createdDatabase = false;
  const createdRoles: string[] = [];
  const clients: PrismaService[] = [];
  let setup: PrismaService;
  let setupTwo: PrismaService;
  let recovery: PrismaService;
  let runtime: PrismaService;
  let passwords: PasswordService;
  let auth: AuthService;
  let app: INestApplication;
  let base: string;
  let ownerUrl: string;
  const profile = (token: string) =>
    fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });

  beforeAll(async () => {
    const url = process.env.TEST_POSTGRES_ADMIN_URL;
    if (!url)
      throw new Error(
        'TEST_POSTGRES_ADMIN_URL is required; this PostgreSQL gate never silently skips.',
      );
    admin = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
    await admin.connect();
    // Names and passwords below contain only generated lowercase identifier/hex characters.
    await admin.query(`CREATE DATABASE "${database}"`);
    createdDatabase = true;
    const target = new URL(url);
    target.pathname = `/${database}`;
    ownerUrl = target.toString();
    owner = new Client({ connectionString: ownerUrl });
    await owner.connect();
    for (const name of Object.values(names)) {
      await admin.query(
        `CREATE ROLE "${name}" LOGIN PASSWORD '${secret}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`,
      );
      createdRoles.push(name);
    }
    const migrations = resolve(__dirname, '../../prisma/migrations');
    await owner.query(
      readFileSync(resolve(migrations, '202609030001_initial_r2/migration.sql'), 'utf8'),
    );
    await owner.query(
      readFileSync(resolve(migrations, '202609030002_admin_constraints/migration.sql'), 'utf8'),
    );
    await owner.query('BEGIN');
    for (const [key, name] of Object.entries(names)) {
      await owner.query('SELECT set_config($1, $2, true)', [`bookstore.${key}_role`, name]);
    }
    await owner.query(
      readFileSync(resolve(__dirname, '../../../../deploy/database/privileges.sql'), 'utf8'),
    );
    await owner.query('COMMIT');

    const connect = async (name: string) => {
      const roleUrl = new URL(ownerUrl);
      roleUrl.username = name;
      roleUrl.password = secret;
      const prisma = new PrismaService(new ConfigService({ DATABASE_URL: roleUrl.toString() }));
      clients.push(prisma);
      await prisma.onModuleInit();
      return prisma;
    };
    setup = await connect(names.setup);
    setupTwo = await connect(names.setup);
    recovery = await connect(names.recovery);
    runtime = await connect(names.runtime);
    const config = new ConfigService({
      AUTH_ALLOWED_ORIGINS: 'https://store.example.test',
      JWT_ACCESS_SECRET: randomBytes(32).toString('base64'),
      JWT_REFRESH_SECRET: randomBytes(32).toString('base64'),
      JWT_ISSUER: 'postgres-test',
      JWT_ACCESS_AUDIENCE: 'access',
      JWT_REFRESH_AUDIENCE: 'refresh',
      PASSWORD_ARGON2_MEMORY_COST: 19456,
      PASSWORD_ARGON2_TIME_COST: 2,
    });
    passwords = new PasswordService(config);
    const module = await Test.createTestingModule({ imports: [AuthModule] })
      .overrideProvider(ConfigService)
      .useValue(config)
      .overrideProvider(PrismaService)
      .useValue(runtime)
      .overrideProvider(PasswordService)
      .useValue(passwords)
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
    auth = app.get(AuthService);
  }, 60_000);

  beforeEach(async () => {
    // Owner-only reset on the database created above, never on the supplied admin database.
    if (!createdDatabase || !owner || new URL(ownerUrl).pathname !== `/${database}`)
      throw new Error('Unsafe test reset');
    await owner.query('TRUNCATE TABLE public.users CASCADE');
  });

  afterAll(async () => {
    await app?.close();
    await Promise.all(clients.map((client) => client.close()));
    await owner?.end();
    if (createdDatabase) await admin.query(`DROP DATABASE "${database}"`);
    for (const name of createdRoles) await admin.query(`DROP ROLE "${name}"`);
    await admin?.end();
  }, 30_000);

  const seed = () =>
    setupAdmin(setup, passwords, async () => ({ email, displayName: 'Admin', password }));

  it('runs preflight with real limited roles and creates exactly nine domain tables', async () => {
    await assertOperationalDatabase(setup, 'setup', names.setup);
    await assertOperationalDatabase(recovery, 'recovery', names.recovery);
    const rows = await owner.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    expect(rows.rowCount).toBe(9);
  });

  it('concurrent setup inserts once; repeating it preserves the password and active session', async () => {
    const input = async () => ({ email, displayName: 'Admin', password });
    const result = await Promise.all([
      setupAdmin(setup, passwords, input),
      setupAdmin(setupTwo, passwords, input),
    ]);
    expect(result.sort()).toEqual(['already_exists', 'created']);
    await auth.login({ email, password });
    const before = await runtime.user.findUniqueOrThrow({ where: { singletonKey: 1 } });
    expect(
      await setupAdmin(setup, passwords, async () => {
        throw new Error('Must not read secrets');
      }),
    ).toBe('already_exists');
    expect(await runtime.user.findUniqueOrThrow({ where: { singletonKey: 1 } })).toEqual(before);
  });

  it('database rejects a second account and denies delete/truncate/id/role writes for application roles', async () => {
    await seed();
    await expect(
      owner.query(
        'INSERT INTO users (id,singleton_key,email,password_hash,display_name) VALUES ($1,2,$2,$3,$4)',
        [randomUUID(), 'second@example.test', 'hash', 'Other'],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      runtime.user.create({
        data: { email: 'other@example.test', displayName: 'Other', passwordHash: 'hash' },
      }),
    ).rejects.toBeDefined();
    for (const client of [runtime, setup, recovery]) {
      await expect(client.$executeRaw`DELETE FROM users`).rejects.toBeDefined();
      await expect(client.$executeRaw`TRUNCATE TABLE users`).rejects.toBeDefined();
      await expect(client.$executeRaw`UPDATE users SET role = 'ADMIN'`).rejects.toBeDefined();
      await expect(client.$executeRaw`UPDATE users SET singleton_key = 1`).rejects.toBeDefined();
    }
    await expect(
      setup.$executeRaw`UPDATE users SET password_hash = 'replaced'`,
    ).rejects.toBeDefined();
    expect(await runtime.user.count()).toBe(1);
  });

  it('concurrent logins leave exactly one usable session and old logout cannot revoke it', async () => {
    await seed();
    const old = await auth.login({ email, password });
    const results = await Promise.allSettled([
      auth.login({ email, password }),
      auth.login({ email, password }),
    ]);
    const tokens = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    expect(tokens.length).toBeGreaterThan(0);
    const statuses = await Promise.all(
      tokens.map(async (t) => (await profile(t.accessToken)).status),
    );
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect((await profile(old.accessToken)).status).toBe(401);
    await auth.logout(old.refreshToken, 'refresh');
    expect(
      await runtime.user.findUniqueOrThrow({ where: { singletonKey: 1 } }).then((u) => u.sessionId),
    ).not.toBeNull();
  });

  it('concurrent refresh replay commits revocation and rejects both access tokens', async () => {
    await seed();
    const first = await auth.login({ email, password });
    const outcomes = await Promise.allSettled([
      auth.refresh(first.refreshToken),
      auth.refresh(first.refreshToken),
    ]);
    expect(outcomes.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const winner = outcomes.find((r) => r.status === 'fulfilled');
    if (winner?.status !== 'fulfilled') throw new Error('No refresh winner');
    expect((await profile(first.accessToken)).status).toBe(401);
    expect((await profile(winner.value.accessToken)).status).toBe(401);
    const state = await runtime.user.findUniqueOrThrow({ where: { singletonKey: 1 } });
    expect(state.sessionId).toBeNull();
    expect(state.refreshGeneration).toBe(0);
  });

  it('password change racing refresh cannot revive the old session', async () => {
    await seed();
    const first = await auth.login({ email, password });
    const state = await new IdentityReaderService(runtime).readCurrentIdentity();
    if (!state?.sessionId || !state.sessionExpiresAt) throw new Error('Missing identity');
    const changedPassword = 'a different long password';
    const outcomes = await Promise.allSettled([
      auth.changePassword(
        { ...state, sessionId: state.sessionId, sessionExpiresAt: state.sessionExpiresAt },
        { currentPassword: password, newPassword: changedPassword },
      ),
      auth.refresh(first.refreshToken),
    ]);
    expect(outcomes[0]!.status).toBe('fulfilled');
    expect((await profile(first.accessToken)).status).toBe(401);
    const rotated = outcomes[1];
    if (rotated?.status === 'fulfilled')
      expect((await profile(rotated.value!.accessToken)).status).toBe(401);
    await expect(auth.login({ email, password })).rejects.toBeDefined();
    await expect(auth.login({ email, password: changedPassword })).resolves.toBeDefined();
  });

  it('recovery racing refresh uses the recovery role and revokes the session', async () => {
    await seed();
    const first = await auth.login({ email, password });
    const outcomes = await Promise.allSettled([
      recoverAdmin(
        new IdentityReaderService(recovery),
        new UsersService(recovery),
        passwords,
        async () => ({ password: 'a recovered long password' }),
      ),
      auth.refresh(first.refreshToken),
    ]);
    expect(outcomes[0]).toMatchObject({ status: 'fulfilled', value: 'recovered' });
    expect((await profile(first.accessToken)).status).toBe(401);
    const rotated = outcomes[1];
    if (rotated?.status === 'fulfilled')
      expect((await profile(rotated.value.accessToken)).status).toBe(401);
  });

  it('outer transaction rollback undoes password replacement and session revocation', async () => {
    await seed();
    const first = await auth.login({ email, password });
    const snapshot = await runtime.user.findUniqueOrThrow({ where: { singletonKey: 1 } });
    const newHash = await passwords.hash('a rolled back long password');
    const users = new UsersService(runtime);
    await expect(
      runtime.$transaction(async (tx) => {
        const result = await users.replacePassword(
          {
            expected: {
              adminId: snapshot.id,
              sessionId: snapshot.sessionId!,
              authVersion: snapshot.authVersion,
            },
            expectedPasswordHash: snapshot.passwordHash,
            newPasswordHash: newHash,
          },
          tx,
        );
        expect(result.status).toBe('updated');
        throw new Error('rollback fixture');
      }),
    ).rejects.toThrow('rollback fixture');
    expect(await runtime.user.findUniqueOrThrow({ where: { singletonKey: 1 } })).toEqual(snapshot);
    expect((await profile(first.accessToken)).status).toBe(200);
  });
});
