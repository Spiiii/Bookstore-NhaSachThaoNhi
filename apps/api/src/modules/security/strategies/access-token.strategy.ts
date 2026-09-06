import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IdentityReaderService, type CurrentIdentity } from '../../users/identity-reader.service';
import { JwtPolicy } from '../services/jwt-policy.service';
import { SecurityTokenService } from '../services/security-token.service';
import type { AuthenticatedAdmin, SecurityRequest } from '../types/security.types';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    policy: JwtPolicy,
    private readonly tokens: SecurityTokenService,
    private readonly identities: IdentityReaderService,
  ) {
    super({
      jwtFromRequest: (request: SecurityRequest) => {
        const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
        return token && token.length <= 8192 ? token : null;
      },
      secretOrKey: policy.accessKey,
      algorithms: ['HS256'],
      issuer: policy.issuer,
      audience: policy.accessAudience,
      ignoreExpiration: false,
    });
  }

  async validate(payload: unknown): Promise<AuthenticatedAdmin> {
    const claims = this.tokens.validateVerifiedAccessClaims(payload);
    let identity: CurrentIdentity | null;
    try {
      identity = await this.identities.readCurrentIdentity();
    } catch {
      throw new ServiceUnavailableException({
        code: 'AUTH_STATE_UNAVAILABLE',
        message: 'Authentication state unavailable.',
      });
    }
    if (
      !identity ||
      identity.role !== 'ADMIN' ||
      identity.id !== claims.sub ||
      identity.sessionId !== claims.sid ||
      identity.authVersion !== claims.ver
    ) {
      throw new UnauthorizedException({
        code: 'SESSION_REPLACED',
        message: 'Session is no longer current.',
      });
    }
    if (
      !identity.sessionExpiresAt ||
      !Number.isFinite(identity.sessionExpiresAt.getTime()) ||
      identity.sessionExpiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException({ code: 'SESSION_EXPIRED', message: 'Session expired.' });
    }
    return {
      id: identity.id,
      email: identity.email,
      displayName: identity.displayName,
      role: identity.role,
      sessionId: identity.sessionId,
      authVersion: identity.authVersion,
      sessionExpiresAt: identity.sessionExpiresAt,
    };
  }
}
