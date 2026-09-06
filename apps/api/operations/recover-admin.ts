import 'reflect-metadata';
import { PasswordService } from '../src/infrastructure/credentials/password.service';
import { IdentityReaderService } from '../src/modules/users/identity-reader.service';
import { UsersService } from '../src/modules/users/users.service';
import {
  type OperationOutcome,
  type SecretInput,
  readSecretInput,
  requireFields,
  requirePassword,
  runOperation,
} from './bootstrap';

export async function recoverAdmin(
  identities: IdentityReaderService,
  users: UsersService,
  passwords: PasswordService,
  readInput: SecretInput,
): Promise<OperationOutcome> {
  const identity = await identities.readCurrentIdentity();
  if (!identity) throw new Error('Admin is missing; recovery never creates an account.');
  const credential = await identities.findLoginCredential(identity.email);
  if (!credential || credential.id !== identity.id || credential.role !== 'ADMIN') {
    throw new Error('Admin credential snapshot is unavailable.');
  }
  const input = await readInput();
  try {
    requireFields(input, ['password']);
    const newPasswordHash = await passwords.hash(requirePassword(input.password));
    const result = await users.recoverPassword({
      expected: {
        adminId: credential.id,
        authVersion: credential.authVersion,
        passwordHash: credential.passwordHash,
      },
      newPasswordHash,
    });
    if (result.status !== 'updated')
      throw new Error(
        'Recovery did not commit; obtain a fresh authorized snapshot before retrying.',
      );
    return 'recovered';
  } finally {
    for (const key of Object.keys(input)) delete input[key];
  }
}

if (require.main === module) {
  void runOperation('recovery', (context) =>
    recoverAdmin(
      context.get(IdentityReaderService),
      context.get(UsersService),
      context.get(PasswordService),
      readSecretInput,
    ),
  );
}
