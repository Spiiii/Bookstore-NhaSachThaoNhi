import 'reflect-metadata';
import { PasswordService } from '../src/infrastructure/credentials/password.service';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { assertPasswordHash } from '../src/modules/users/admin-state.rules';
import {
  type OperationOutcome,
  type SecretInput,
  readSecretInput,
  requireEmail,
  requireFields,
  requirePassword,
  runOperation,
} from './bootstrap';

/** The only admin insertion entry point. Never updates an existing account. */
export async function setupAdmin(
  prisma: PrismaService,
  passwords: PasswordService,
  readInput: SecretInput,
): Promise<OperationOutcome> {
  const exists = () => prisma.user.findUnique({ where: { singletonKey: 1 }, select: { id: true } });
  if (await exists()) return 'already_exists';
  const input = await readInput();
  try {
    requireFields(input, ['email', 'displayName', 'password']);
    const email = requireEmail(input.email);
    if (
      typeof input.displayName !== 'string' ||
      !input.displayName.trim() ||
      input.displayName.trim().length > 120
    ) {
      throw new Error('Display name is required and must not exceed 120 characters.');
    }
    const passwordHash = await passwords.hash(requirePassword(input.password));
    assertPasswordHash(passwordHash);
    try {
      await prisma.user.create({
        data: {
          singletonKey: 1,
          email,
          displayName: input.displayName.trim(),
          passwordHash,
          role: 'ADMIN',
        },
        select: { id: true },
      });
    } catch (error) {
      // Confirm a concurrent singleton winner. Do not treat unrelated failures as successful setup.
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002' &&
        (await exists())
      ) {
        return 'already_exists';
      }
      throw error;
    }
    return 'created';
  } finally {
    for (const key of Object.keys(input)) delete input[key];
  }
}

if (require.main === module) {
  void runOperation('setup', (context) =>
    setupAdmin(context.get(PrismaService), context.get(PasswordService), readSecretInput),
  );
}
