import {
  BadRequestException,
  ConflictException,
  Injectable,
  type OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PasswordService } from '../../infrastructure/credentials/password.service';
import { SecurityTokenService } from '../security/services/security-token.service';
import type { AuthenticatedAdmin, TokenSession } from '../security/types/security.types';
import { IdentityReaderService } from '../users/identity-reader.service';
import type { MutationResult, SessionExpectation } from '../users/types/admin-state.types';
import { UsersService } from '../users/users.service';
import type { AdminProfileDto, ChangePasswordDto, LoginDto } from './auth.dto';

export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly sessionExpiresAt: Date;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash!: string;

  constructor(
    private readonly users: UsersService,
    private readonly identities: IdentityReaderService,
    private readonly passwords: PasswordService,
    private readonly tokens: SecurityTokenService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.dummyHash = await this.passwords.hash(randomBytes(32).toString('base64url'));
  }

  async login(input: LoginDto): Promise<AuthTokens> {
    const credential = await this.identities.findLoginCredential(input.email);
    const valid = await this.passwords.verify(
      input.password,
      credential?.passwordHash ?? this.dummyHash,
    );
    if (!credential || !valid || credential.role !== 'ADMIN') {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }
    if (credential.authVersion >= 2_147_483_647)
      throw new ConflictException('Session counter exhausted.');
    const session: TokenSession = {
      adminId: credential.id,
      sessionId: randomUUID(),
      authVersion: credential.authVersion + 1,
      sessionExpiresAt: new Date((Math.floor(Date.now() / 1000) + 604_800) * 1000),
    };
    const prepared = await this.prepare(session, 0);
    const result = await this.users.replaceSession({
      expected: {
        adminId: credential.id,
        authVersion: credential.authVersion,
        passwordHash: credential.passwordHash,
      },
      sessionId: session.sessionId,
      refreshTokenHash: this.digest(prepared.refreshToken),
      sessionExpiresAt: session.sessionExpiresAt,
    });
    this.requireCommit(result);
    return prepared;
  }

  me(admin: AuthenticatedAdmin): AdminProfileDto {
    return { id: admin.id, email: admin.email, displayName: admin.displayName, role: admin.role };
  }

  async refresh(rawToken: string): Promise<AuthTokens> {
    const claims = await this.tokens.verifyRefresh(rawToken);
    if (claims.generation >= 2_147_483_647)
      throw new UnauthorizedException('Refresh counter exhausted.');
    const session: TokenSession = {
      adminId: claims.sub,
      sessionId: claims.sid,
      authVersion: claims.ver,
      sessionExpiresAt: new Date(claims.exp * 1000),
    };
    const prepared = await this.prepare(session, claims.generation + 1);
    // Default Users transaction commits replay revocation before this method throws.
    const result = await this.users.rotateSession({
      expected: session,
      refreshGeneration: claims.generation,
      refreshTokenHash: this.digest(rawToken),
      nextRefreshTokenHash: this.digest(prepared.refreshToken),
    });
    this.requireCommit(result);
    return prepared;
  }

  async logout(rawToken: string, purpose: 'access' | 'refresh'): Promise<boolean> {
    let expected: SessionExpectation;
    try {
      const claims =
        purpose === 'access'
          ? await this.tokens.verifyAccess(rawToken)
          : await this.tokens.verifyRefresh(rawToken);
      expected = { adminId: claims.sub, sessionId: claims.sid, authVersion: claims.ver };
    } catch (error) {
      if (error instanceof UnauthorizedException) return false;
      throw error;
    }
    // A stale token cannot revoke a newer session. No current-session guard is needed for idempotence.
    await this.users.revokeSession(expected);
    return true;
  }

  async changePassword(admin: AuthenticatedAdmin, input: ChangePasswordDto): Promise<void> {
    const credential = await this.identities.findLoginCredential(admin.email);
    if (!credential || credential.id !== admin.id || credential.authVersion !== admin.authVersion) {
      throw new UnauthorizedException({
        code: 'SESSION_REPLACED',
        message: 'Session is no longer current.',
      });
    }
    if (!(await this.passwords.verify(input.currentPassword, credential.passwordHash))) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid current password.',
      });
    }
    if (input.newPassword === input.currentPassword)
      throw new BadRequestException('New password must be different.');
    const newPasswordHash = await this.passwords.hash(input.newPassword);
    const result = await this.users.replacePassword({
      expected: { adminId: admin.id, sessionId: admin.sessionId, authVersion: admin.authVersion },
      expectedPasswordHash: credential.passwordHash,
      newPasswordHash,
    });
    this.requireCommit(result);
  }

  private async prepare(session: TokenSession, generation: number): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.signAccess(session),
      this.tokens.signRefresh(session, generation),
    ]);
    return { accessToken, refreshToken, sessionExpiresAt: session.sessionExpiresAt };
  }

  private digest(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private requireCommit(result: MutationResult): void {
    if (result.status === 'updated') return;
    throw new UnauthorizedException({
      code:
        result.status === 'replayed'
          ? 'REFRESH_REPLAYED'
          : result.status === 'expired'
            ? 'SESSION_EXPIRED'
            : 'SESSION_REPLACED',
      message: 'Session is no longer valid. Sign in again.',
    });
  }
}
