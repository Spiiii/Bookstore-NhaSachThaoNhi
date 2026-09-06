import { ConfigService } from '@nestjs/config';
import { PasswordService } from '../../src/infrastructure/credentials/password.service';

export type OperationMode = 'setup' | 'recovery';
export interface OperationEnvironment {
  readonly databaseUrl: string;
  readonly databaseRole: string;
  readonly operatorId: string;
}

/** No DATABASE_URL fallback: only the mode-specific secret may be selected. */
export function validateOperationEnvironment(
  mode: OperationMode,
  env: NodeJS.ProcessEnv,
): OperationEnvironment {
  const prefix = mode === 'setup' ? 'SETUP' : 'RECOVERY';
  const databaseUrl = env[`${prefix}_DATABASE_URL`];
  const databaseRole = env[`${prefix}_DATABASE_ROLE`];
  const operatorId = env.OPERATOR_ID;
  if (!databaseUrl || databaseUrl.trim() !== databaseUrl) {
    throw new Error('Mode-specific database credential is required.');
  }
  try {
    const parsed = new URL(databaseUrl);
    if (
      !['postgres:', 'postgresql:'].includes(parsed.protocol) ||
      !parsed.hostname ||
      !parsed.username
    ) {
      throw new Error();
    }
  } catch {
    throw new Error('Invalid operational database URL.');
  }
  if (!databaseRole || !/^[a-z_][a-z0-9_]{0,62}$/.test(databaseRole)) {
    throw new Error('An explicit operational database role is required.');
  }
  if (!operatorId || !/^[A-Za-z0-9@._:-]{1,160}$/.test(operatorId)) {
    throw new Error('OPERATOR_ID is required for operational audit.');
  }
  // Validate shared hash costs before a database context is created; performs no hashing or I/O.
  new PasswordService(new ConfigService(env));
  return { databaseUrl, databaseRole, operatorId };
}
