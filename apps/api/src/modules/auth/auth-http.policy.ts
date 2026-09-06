import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';

@Injectable()
export class AuthHttpPolicy {
  private readonly origins: ReadonlySet<string>;
  private readonly cookieOptions: CookieOptions;
  readonly cookieName = '__Secure-bookstore-refresh';

  constructor(config: ConfigService) {
    const raw = config.get<unknown>('AUTH_ALLOWED_ORIGINS');
    if (typeof raw !== 'string' || !raw.trim()) {
      throw new Error('AUTH_ALLOWED_ORIGINS must contain explicit trusted origins.');
    }
    this.origins = new Set(
      raw.split(',').map((entry) => {
        const origin = entry.trim();
        let url: URL;
        try {
          url = new URL(origin);
        } catch {
          throw new Error('Invalid AUTH_ALLOWED_ORIGINS.');
        }
        if (
          !['https:', 'http:'].includes(url.protocol) ||
          url.origin !== origin ||
          (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
        ) {
          throw new Error('AUTH_ALLOWED_ORIGINS requires HTTPS origins (HTTP loopback only).');
        }
        return origin;
      }),
    );
    const sameSite = config.get<unknown>('AUTH_COOKIE_SAME_SITE') ?? 'strict';
    if (sameSite !== 'strict' && sameSite !== 'lax' && sameSite !== 'none') {
      throw new Error('AUTH_COOKIE_SAME_SITE must be strict, lax or none.');
    }
    const cookiePath = config.get<unknown>('AUTH_COOKIE_PATH') ?? '/auth';
    if (typeof cookiePath !== 'string' || !/^\/(?:[A-Za-z0-9_-]+\/)*auth$/.test(cookiePath)) {
      throw new Error('AUTH_COOKIE_PATH must match the mounted auth path.');
    }
    this.cookieOptions = { httpOnly: true, secure: true, sameSite, path: cookiePath };
  }

  assertOrigin(request: Request): void {
    const origin = request.headers.origin;
    if (typeof origin !== 'string' || !this.origins.has(origin)) {
      throw new ForbiddenException({
        code: 'ORIGIN_REJECTED',
        message: 'Untrusted request origin.',
      });
    }
  }

  readRefresh(request: Request): string {
    const cookies = (request.headers.cookie ?? '')
      .split(';')
      .map((entry) => entry.trim())
      .filter((entry) => entry.startsWith(`${this.cookieName}=`));
    if (cookies.length !== 1) throw this.invalidCookie();
    const token = cookies[0]!.slice(this.cookieName.length + 1);
    if (!token || token.length > 8192 || !/^[A-Za-z0-9_.-]+$/.test(token)) {
      throw this.invalidCookie();
    }
    return token;
  }

  setRefresh(response: Response, token: string, expires: Date): void {
    response.cookie(this.cookieName, token, { ...this.cookieOptions, expires });
  }

  clearRefresh(response: Response): void {
    response.clearCookie(this.cookieName, this.cookieOptions);
  }

  private invalidCookie(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'REFRESH_TOKEN_INVALID',
      message: 'Invalid refresh cookie.',
    });
  }
}
