import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import type { AccessClaims, RefreshClaims, TokenSession } from '../types/security.types';
import { JwtPolicy } from './jwt-policy.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const counter = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 2_147_483_647;
const uuid = (value: unknown): value is string =>
  typeof value === 'string' && value.length === 36 && UUID.test(value);

@Injectable()
export class SecurityTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly policy: JwtPolicy,
  ) {}

  /** Signing is a token mechanic only. Auth must not expose it until session persistence commits. */
  async signAccess(session: TokenSession): Promise<string> {
    const { now, expires } = this.validateSession(session);
    return this.jwt.signAsync(
      {
        sub: session.adminId,
        sid: session.sessionId,
        ver: session.authVersion,
        purpose: 'access',
        iat: now,
        exp: Math.min(expires, now + this.policy.accessTtlSeconds),
      },
      {
        secret: this.policy.accessKey,
        algorithm: 'HS256',
        issuer: this.policy.issuer,
        audience: this.policy.accessAudience,
      },
    );
  }

  async signRefresh(session: TokenSession, generation: number): Promise<string> {
    const { now, expires } = this.validateSession(session);
    if (!counter(generation)) throw new TypeError('Invalid refresh generation.');
    return this.jwt.signAsync(
      {
        sub: session.adminId,
        sid: session.sessionId,
        ver: session.authVersion,
        purpose: 'refresh',
        generation,
        jti: randomBytes(32).toString('base64url'),
        iat: now,
        exp: expires,
      },
      {
        secret: this.policy.refreshKey,
        algorithm: 'HS256',
        issuer: this.policy.issuer,
        audience: this.policy.refreshAudience,
      },
    );
  }

  /** Cryptographic verification only; protected requests must also run the current-session strategy. */
  async verifyAccess(token: string): Promise<AccessClaims> {
    return this.validateVerifiedAccessClaims(await this.verify(token, 'access'));
  }

  /** No rotation or persistence. Auth must subsequently call the Users session-state operation. */
  async verifyRefresh(token: string): Promise<RefreshClaims> {
    const payload = this.claims(await this.verify(token, 'refresh'), 'refresh');
    if (
      !counter(payload.generation) ||
      typeof payload.jti !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/.test(payload.jti) ||
      Buffer.from(payload.jti, 'base64url').toString('base64url') !== payload.jti
    ) {
      throw this.invalid();
    }
    return payload as unknown as RefreshClaims;
  }

  /** Only for a payload whose signature/algorithm/issuer/audience Passport already verified. */
  validateVerifiedAccessClaims(payload: unknown): AccessClaims {
    return this.claims(payload, 'access') as unknown as AccessClaims;
  }

  private async verify(token: string, purpose: 'access' | 'refresh'): Promise<unknown> {
    if (typeof token !== 'string' || !token || token.length > 8192) throw this.invalid();
    try {
      return await this.jwt.verifyAsync(token, {
        secret: purpose === 'access' ? this.policy.accessKey : this.policy.refreshKey,
        algorithms: ['HS256'],
        issuer: this.policy.issuer,
        audience: purpose === 'access' ? this.policy.accessAudience : this.policy.refreshAudience,
        ignoreExpiration: false,
      });
    } catch {
      throw this.invalid();
    }
  }

  private claims(value: unknown, purpose: 'access' | 'refresh'): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw this.invalid();
    const p = value as Record<string, unknown>;
    const now = Math.floor(Date.now() / 1000);
    const ttl = purpose === 'access' ? this.policy.accessTtlSeconds : this.policy.sessionTtlSeconds;
    if (
      !uuid(p.sub) ||
      !uuid(p.sid) ||
      !counter(p.ver) ||
      p.purpose !== purpose ||
      p.iss !== this.policy.issuer ||
      p.aud !== (purpose === 'access' ? this.policy.accessAudience : this.policy.refreshAudience) ||
      typeof p.iat !== 'number' ||
      !Number.isSafeInteger(p.iat) ||
      p.iat < 0 ||
      p.iat > now ||
      typeof p.exp !== 'number' ||
      !Number.isSafeInteger(p.exp) ||
      p.exp <= now ||
      p.exp <= p.iat ||
      p.exp - p.iat > ttl
    ) {
      throw this.invalid();
    }
    return p;
  }

  private validateSession(session: TokenSession): { now: number; expires: number } {
    const now = Math.floor(Date.now() / 1000);
    const expires =
      session.sessionExpiresAt instanceof Date
        ? Math.floor(session.sessionExpiresAt.getTime() / 1000)
        : NaN;
    if (
      !uuid(session.adminId) ||
      !uuid(session.sessionId) ||
      !counter(session.authVersion) ||
      !Number.isSafeInteger(expires) ||
      expires <= now ||
      expires > now + this.policy.sessionTtlSeconds
    ) {
      throw new TypeError('Invalid token session or absolute expiry.');
    }
    return { now, expires };
  }

  private invalid(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'TOKEN_INVALID',
      message: 'Invalid or expired token.',
    });
  }
}
