import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { setupAdmin } from '../../operations/setup-admin';
import { PasswordService } from '../../src/infrastructure/credentials/password.service';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { AuthService } from '../../src/modules/auth/auth.service';

/** Isolated real-PostgreSQL fixture. It never creates objects in the supplied admin database. */
export class AdminPostgresFixture {
  readonly suffix = randomBytes(6).toString('hex');
  readonly database = `bookstore_test_${this.suffix}`;
  readonly names = {
    runtime: `bs_runtime_${this.suffix}`,
    setup: `bs_setup_${this.suffix}`,
    recovery: `bs_recovery_${this.suffix}`,
  };
  readonly secret = randomBytes(32).toString('hex');
  readonly email = 'admin@example.test';
  readonly password = 'a long initial test password';
  admin!: Client;
  owner!: Client;
  ownerUrl!: string;
  runtime!: PrismaService;
  setup!: PrismaService;
  setupTwo!: PrismaService;
  recovery!: PrismaService;
  passwords!: PasswordService;
  auth!: AuthService;
  app!: INestApplication;
  base!: string;
  private createdDatabase = false;
  private readonly createdRoles: string[] = [];
  private readonly clients: PrismaService[] = [];

  async start(): Promise<void> {
    const url = process.env.TEST_POSTGRES_ADMIN_URL;
    if (!url) throw new Error('TEST_POSTGRES_ADMIN_URL is required; PostgreSQL integration tests were NOT run.');
    this.admin = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
    await this.admin.connect();
    await this.admin.query(`CREATE DATABASE "${this.database}"`);
    this.createdDatabase = true;
    const target = new URL(url);
    target.pathname = `/${this.database}`;
    this.ownerUrl = target.toString();
    this.owner = new Client({ connectionString: this.ownerUrl });
    await this.owner.connect();
    for (const name of Object.values(this.names)) {
      await this.admin.query(`CREATE ROLE "${name}" LOGIN PASSWORD '${this.secret}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`);
      this.createdRoles.push(name);
    }
    const migrations = resolve(__dirname, '../../prisma/migrations');
    await this.owner.query(readFileSync(resolve(migrations, '202609030001_initial_r2/migration.sql'), 'utf8'));
    await this.owner.query(readFileSync(resolve(migrations, '202609030002_admin_constraints/migration.sql'), 'utf8'));
    await this.owner.query('BEGIN');
    for (const [key, name] of Object.entries(this.names)) {
      await this.owner.query('SELECT set_config($1, $2, true)', [`bookstore.${key}_role`, name]);
    }
    await this.owner.query(readFileSync(resolve(__dirname, '../../../../deploy/database/privileges.sql'), 'utf8'));
    await this.owner.query('COMMIT');

    this.setup = await this.connect(this.names.setup);
    this.setupTwo = await this.connect(this.names.setup);
    this.recovery = await this.connect(this.names.recovery);
    this.runtime = await this.connect(this.names.runtime);
    const config = new ConfigService({
      AUTH_ALLOWED_ORIGINS: 'https://store.example.test',
      JWT_ACCESS_SECRET: randomBytes(32).toString('base64'),
      JWT_REFRESH_SECRET: randomBytes(32).toString('base64'),
      JWT_ISSUER: 'postgres-integration',
      JWT_ACCESS_AUDIENCE: 'access',
      JWT_REFRESH_AUDIENCE: 'refresh',
      PASSWORD_ARGON2_MEMORY_COST: 19456,
      PASSWORD_ARGON2_TIME_COST: 2,
    });
    this.passwords = new PasswordService(config);
    const module = await Test.createTestingModule({ imports: [AuthModule] })
      .overrideProvider(ConfigService).useValue(config)
      .overrideProvider(PrismaService).useValue(this.runtime)
      .overrideProvider(PasswordService).useValue(this.passwords)
      .compile();
    this.app = module.createNestApplication();
    this.app.useLogger(false);
    await this.app.listen(0, '127.0.0.1');
    this.base = await this.app.getUrl();
    this.auth = this.app.get(AuthService);
  }

  async reset(): Promise<void> {
    if (!this.createdDatabase || new URL(this.ownerUrl).pathname !== `/${this.database}`) throw new Error('Unsafe integration reset target.');
    await this.owner.query('TRUNCATE TABLE public.users CASCADE');
  }

  seed() {
    return setupAdmin(this.setup, this.passwords, async () => ({ email: this.email, displayName: 'Admin', password: this.password }));
  }

  profile(token: string) {
    return fetch(`${this.base}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  }

  async stop(): Promise<void> {
    await this.app?.close();
    await Promise.all(this.clients.map((client) => client.close()));
    await this.owner?.end();
    if (this.createdDatabase) await this.admin.query(`DROP DATABASE "${this.database}"`);
    for (const name of this.createdRoles) await this.admin.query(`DROP ROLE "${name}"`);
    await this.admin?.end();
  }

  private async connect(name: string): Promise<PrismaService> {
    const url = new URL(this.ownerUrl);
    url.username = name;
    url.password = this.secret;
    const prisma = new PrismaService(new ConfigService({ DATABASE_URL: url.toString() }));
    this.clients.push(prisma);
    await prisma.onModuleInit();
    return prisma;
  }
}
