import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Role } from '../../../generated/prisma/client';
import type { PasswordService } from '../../../infrastructure/credentials/password.service';
import type { SecurityTokenService } from '../../security/services/security-token.service';
import type { AuthenticatedAdmin } from '../../security/types/security.types';
import type { IdentityReaderService } from '../../users/identity-reader.service';
import type { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';

const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';
const PASSWORD_HASH = '$argon2id$fixture';
const EXPIRES_AT = Math.floor(Date.now() / 1000) + 3600;

const credential = {
  id: ADMIN_ID,
  email: 'admin@example.com',
  displayName: 'Admin',
  role: Role.ADMIN,
  passwordHash: PASSWORD_HASH,
  authVersion: 4,
};

function harness() {
  const users = {
    replaceSession: jest.fn().mockResolvedValue({ status: 'updated' }),
    rotateSession: jest.fn().mockResolvedValue({ status: 'updated' }),
    revokeSession: jest.fn().mockResolvedValue({ status: 'updated' }),
    replacePassword: jest.fn().mockResolvedValue({ status: 'updated' }),
  };
  const identities = { findLoginCredential: jest.fn().mockResolvedValue(credential) };
  const passwords = {
    hash: jest.fn().mockResolvedValue('$argon2id$new'),
    verify: jest.fn().mockResolvedValue(true),
  };
  const tokens = {
    signAccess: jest.fn().mockResolvedValue('access-token'),
    signRefresh: jest.fn().mockResolvedValue('refresh-token'),
    verifyAccess: jest.fn(),
    verifyRefresh: jest.fn(),
  };
  const service = new AuthService(
    users as unknown as UsersService,
    identities as unknown as IdentityReaderService,
    passwords as unknown as PasswordService,
    tokens as unknown as SecurityTokenService,
  );
  return { service, users, identities, passwords, tokens };
}

describe('AuthService singleton admin orchestration', () => {
  it('uses a dummy Argon2 hash for unknown accounts before rejecting credentials', async () => {
    const h = harness();
    await h.service.onModuleInit();
    const dummyHash = h.passwords.hash.mock.results[0]!.value;
    h.identities.findLoginCredential.mockResolvedValue(null);
    h.passwords.verify.mockResolvedValue(false);

    await expect(h.service.login({ email: 'missing@example.com', password: 'guess' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(h.passwords.verify).toHaveBeenCalledWith('guess', await dummyHash);
    expect(h.users.replaceSession).not.toHaveBeenCalled();
  });

  it('replaces the one active session only after credential verification', async () => {
    const h = harness();
    await h.service.onModuleInit();

    await expect(h.service.login({ email: credential.email, password: 'correct-password' })).resolves.toMatchObject({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    expect(h.passwords.verify).toHaveBeenLastCalledWith('correct-password', PASSWORD_HASH);
    expect(h.users.replaceSession).toHaveBeenCalledWith(expect.objectContaining({
      expected: { adminId: ADMIN_ID, authVersion: 4, passwordHash: PASSWORD_HASH },
      refreshTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
  });

  it('does not issue a usable login when the credential snapshot became stale', async () => {
    const h = harness();
    await h.service.onModuleInit();
    h.users.replaceSession.mockResolvedValue({ status: 'stale' });

    await expect(h.service.login({ email: credential.email, password: 'correct-password' })).rejects.toMatchObject({ response: expect.objectContaining({ code: 'SESSION_REPLACED' }) });
  });

  it('rotates refresh generation without extending absolute session expiry', async () => {
    const h = harness();
    h.tokens.verifyRefresh.mockResolvedValue({ sub: ADMIN_ID, sid: SESSION_ID, ver: 4, generation: 2, exp: EXPIRES_AT });

    await h.service.refresh('old-refresh-token');

    expect(h.tokens.signRefresh).toHaveBeenCalledWith(expect.objectContaining({ sessionExpiresAt: new Date(EXPIRES_AT * 1000) }), 3);
    expect(h.users.rotateSession).toHaveBeenCalledWith(expect.objectContaining({ refreshGeneration: 2, refreshTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) }));
  });

  it('surfaces refresh replay revocation as REFRESH_REPLAYED', async () => {
    const h = harness();
    h.tokens.verifyRefresh.mockResolvedValue({ sub: ADMIN_ID, sid: SESSION_ID, ver: 4, generation: 2, exp: EXPIRES_AT });
    h.users.rotateSession.mockResolvedValue({ status: 'replayed' });

    await expect(h.service.refresh('replayed-token')).rejects.toMatchObject({ response: expect.objectContaining({ code: 'REFRESH_REPLAYED' }) });
  });

  it('changes the password through Users and revokes the current session', async () => {
    const h = harness();
    const admin = { id: ADMIN_ID, email: credential.email, role: Role.ADMIN, sessionId: SESSION_ID, authVersion: 4 } as AuthenticatedAdmin;

    await h.service.changePassword(admin, { currentPassword: 'current-password', newPassword: 'different-password-value' });

    expect(h.passwords.hash).toHaveBeenCalledWith('different-password-value');
    expect(h.users.replacePassword).toHaveBeenCalledWith({
      expected: { adminId: ADMIN_ID, sessionId: SESSION_ID, authVersion: 4 },
      expectedPasswordHash: PASSWORD_HASH,
      newPasswordHash: '$argon2id$new',
    });
  });

  it('rejects password reuse before hashing or persistence', async () => {
    const h = harness();
    const admin = { id: ADMIN_ID, email: credential.email, role: Role.ADMIN, sessionId: SESSION_ID, authVersion: 4 } as AuthenticatedAdmin;

    await expect(h.service.changePassword(admin, { currentPassword: 'same-password-value', newPassword: 'same-password-value' })).rejects.toBeInstanceOf(BadRequestException);
    expect(h.passwords.hash).not.toHaveBeenCalled();
    expect(h.users.replacePassword).not.toHaveBeenCalled();
  });
});
