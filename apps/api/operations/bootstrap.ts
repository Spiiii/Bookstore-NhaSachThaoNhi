import 'reflect-metadata';
import { type INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { isEmail } from 'class-validator';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { OperationalModule } from './operational.module';
import { type OperationMode, validateOperationEnvironment } from './config/environment.validation';

export type OperationOutcome = 'created' | 'already_exists' | 'recovered';
export type SecretInput = () => Promise<Record<string, unknown>>;

/** Keep constructor-created resources reachable even when Nest initialization rejects. */
export async function createOperationalContext(
  resources: Set<PrismaService>,
): Promise<INestApplicationContext> {
  return NestFactory.createApplicationContext(
    OperationalModule.withResources((resource) => resources.add(resource)),
    { logger: false, abortOnError: false },
  );
}

/** Secret-manager pipe only. Never echo input or accept password/URL CLI arguments. */
export async function readSecretInput(): Promise<Record<string, unknown>> {
  if (process.stdin.isTTY) throw new Error('Provide secret JSON through a controlled stdin pipe.');
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    for await (const chunk of process.stdin) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
      chunks.push(buffer);
      size += buffer.length;
      if (size > 16_384) throw new Error('Secret input exceeds the size limit.');
    }
    const combined = Buffer.concat(chunks);
    try {
      const value: unknown = JSON.parse(combined.toString('utf8'));
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
      return value as Record<string, unknown>;
    } catch {
      throw new Error('Invalid secret input.');
    } finally {
      combined.fill(0);
    }
  } finally {
    for (const chunk of chunks) chunk.fill(0);
  }
}

export function requireFields(input: Record<string, unknown>, fields: string[]): void {
  if (
    Object.keys(input).length !== fields.length ||
    fields.some((key) => !Object.hasOwn(input, key))
  ) {
    throw new Error('Unexpected or missing secret input fields.');
  }
}

export function requirePassword(input: unknown): string {
  if (
    typeof input !== 'string' ||
    Array.from(input).length < 15 ||
    Buffer.byteLength(input, 'utf8') > 1024
  ) {
    throw new Error('New password must have at least 15 characters and at most 1024 UTF-8 bytes.');
  }
  return input;
}

export function requireEmail(input: unknown): string {
  if (typeof input !== 'string') throw new Error('Valid admin email is required.');
  const email = input.trim().toLowerCase();
  if (email.length > 254 || !isEmail(email)) throw new Error('Valid admin email is required.');
  return email;
}

/** Read-only preflight. Full role inheritance/SET ROLE restrictions remain a provisioning gate. */
export async function assertOperationalDatabase(
  prisma: PrismaService,
  mode: OperationMode,
  expectedRole: string,
): Promise<void> {
  const rows = await prisma.$queryRaw<
    Array<{
      role: string;
      login: string;
      unsafe: boolean;
      can_select: boolean;
      can_insert: boolean;
      can_delete: boolean;
      can_truncate: boolean;
      can_update: boolean;
      can_update_any: boolean;
      can_update_protected: boolean;
      can_recover: boolean;
      singleton_check: boolean;
    }>
  >`
    SELECT current_user::text AS role, session_user::text AS login,
      (r.rolsuper OR r.rolcreaterole OR r.rolcreatedb OR r.rolbypassrls OR c.relowner = r.oid) AS unsafe,
      has_table_privilege(current_user, c.oid, 'SELECT') AS can_select,
      has_table_privilege(current_user, c.oid, 'INSERT') AS can_insert,
      has_table_privilege(current_user, c.oid, 'DELETE') AS can_delete,
      has_table_privilege(current_user, c.oid, 'TRUNCATE') AS can_truncate,
      has_table_privilege(current_user, c.oid, 'UPDATE') AS can_update,
      has_any_column_privilege(current_user, c.oid, 'UPDATE') AS can_update_any,
      EXISTS (SELECT 1 FROM unnest(ARRAY['id','singleton_key','role','created_at','display_name','last_login_at']) AS col
        WHERE has_column_privilege(current_user, c.oid, col, 'UPDATE')) AS can_update_protected,
      NOT EXISTS (SELECT 1 FROM unnest(ARRAY['password_hash','auth_version','session_id','refresh_token_hash',
        'refresh_generation','session_expires_at','updated_at']) AS col
        WHERE NOT has_column_privilege(current_user, c.oid, col, 'UPDATE')) AS can_recover,
      EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conrelid = c.oid AND k.contype = 'c' AND k.convalidated
        AND regexp_replace(lower(pg_get_constraintdef(k.oid)), '[[:space:]"()]', '', 'g') = 'checksingleton_key=1') AS singleton_check
    FROM pg_roles r JOIN pg_class c ON c.oid = to_regclass('users')
    WHERE r.rolname = current_user
  `;
  const p = rows[0];
  if (
    !p ||
    p.role !== expectedRole ||
    p.login !== expectedRole ||
    p.unsafe ||
    !p.can_select ||
    p.can_delete ||
    p.can_truncate ||
    !p.singleton_check ||
    (mode === 'setup'
      ? !p.can_insert || p.can_update_any
      : p.can_insert || p.can_update || p.can_update_protected || !p.can_recover)
  ) {
    throw new Error('Operational database privilege/singleton preflight failed.');
  }
}

export async function runOperation(
  mode: OperationMode,
  work: (context: INestApplicationContext) => Promise<OperationOutcome>,
): Promise<void> {
  let context: INestApplicationContext | undefined;
  const resources = new Set<PrismaService>();
  let operatorId = 'unvalidated';
  const previousUrl = process.env.DATABASE_URL;
  const audit = (outcome: string) =>
    process.stdout.write(
      JSON.stringify({
        operation: mode,
        operatorId,
        timestamp: new Date().toISOString(),
        outcome,
      }) + '\n',
    );
  try {
    if (process.argv.length > 2) throw new Error('CLI arguments are not accepted.');
    const environment = validateOperationEnvironment(mode, process.env);
    operatorId = environment.operatorId;
    // Plain PrismaModule is shared with UsersModule. Supply its selected credential before DI.
    process.env.DATABASE_URL = environment.databaseUrl;
    audit('started');
    context = await createOperationalContext(resources);
    await assertOperationalDatabase(context.get(PrismaService), mode, environment.databaseRole);
    const outcome = await work(context);
    audit(outcome);
  } catch {
    process.exitCode = 1;
    audit('failed');
    // Never emit a Prisma/Nest/parser error object, stack or input: it can contain secrets.
    process.stderr.write(
      'Operation failed. Check mode credentials, grants, schema and secret input using the runbook.\n',
    );
  } finally {
    try {
      await context?.close();
    } catch {
      process.exitCode = 1;
      audit('cleanup_failed');
    }
    const closed = await Promise.allSettled([...resources].map((resource) => resource.close()));
    if (closed.some((result) => result.status === 'rejected')) {
      process.exitCode = 1;
      audit('cleanup_failed');
    }
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
    delete process.env.SETUP_DATABASE_URL;
    delete process.env.RECOVERY_DATABASE_URL;
    process.stdin.destroy();
  }
}
