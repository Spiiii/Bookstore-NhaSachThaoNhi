import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { isIP } from 'node:net';
import { SecurityTokenService } from '../security/services/security-token.service';
import type { SecurityRequest } from '../security/types/security.types';
import { AuthHttpPolicy } from './auth-http.policy';

@Injectable()
export class AuthRequestGuard implements CanActivate {
  private readonly windows = new Map<string, { start: number; count: number }>();
  private readonly limits: Readonly<Record<string, number>> = {
    login: 5,
    changePassword: 5,
    refresh: 30,
    logout: 30,
  };

  constructor(
    private readonly policy: AuthHttpPolicy,
    private readonly tokens: SecurityTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SecurityRequest>();
    if (request.method !== 'POST') return true;
    const response = context.switchToHttp().getResponse<Response>();
    response.setHeader('Cache-Control', 'no-store');
    this.policy.assertOrigin(request);
    const action = context.getHandler().name;
    const limit = this.limits[action];
    if (limit === undefined) throw new Error('Missing auth rate-limit policy.');
    // Express resolves ip through its trusted proxy policy, never through arbitrary header parsing here.
    const ip = request.ip ?? request.socket.remoteAddress;
    if (!ip || !isIP(ip)) throw new HttpException('Client address unavailable.', 503);
    const source = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
    this.consume('source:' + action + ':' + source, limit, response);
    let session = request.user
      ? request.user.sessionId + ':' + request.user.authVersion
      : undefined;
    if (!session && (action === 'refresh' || action === 'logout')) {
      try {
        const claims = await this.tokens.verifyRefresh(this.policy.readRefresh(request));
        session = claims.sid + ':' + claims.ver;
      } catch (error) {
        if (!(error instanceof UnauthorizedException)) throw error;
        if (action === 'logout') {
          const bearer = /^Bearer ([A-Za-z0-9_.-]+)$/i.exec(
            request.headers.authorization ?? '',
          )?.[1];
          if (bearer) {
            try {
              const claims = await this.tokens.verifyAccess(bearer);
              session = claims.sid + ':' + claims.ver;
            } catch (accessError) {
              if (!(accessError instanceof UnauthorizedException)) throw accessError;
            }
          }
        }
      }
    }
    // Unsigned input never spends a session quota. This is not persisted-session authorization.
    if (session) this.consume('session:' + action + ':' + session, limit, response);
    return true;
  }

  private consume(key: string, limit: number, response: Response): void {
    const now = Date.now();
    for (const [storedKey, window] of this.windows) {
      if (now - window.start >= 60_000) this.windows.delete(storedKey);
    }
    let window = this.windows.get(key);
    if (!window) {
      // Bound memory without evicting active limits. Shared edge limits remain required for replicas.
      if (this.windows.size >= 10_000) this.reject(response, 60);
      window = { start: now, count: 0 };
      this.windows.set(key, window);
    }
    if (window.count >= limit)
      this.reject(response, Math.max(1, Math.ceil((window.start + 60_000 - now) / 1000)));
    window.count++;
  }

  private reject(response: Response, retry: number): never {
    response.setHeader('Retry-After', retry);
    throw new HttpException({ code: 'AUTH_RATE_LIMITED', message: 'Too many requests.' }, 429);
  }
}
