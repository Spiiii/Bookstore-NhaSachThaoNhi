import { Injectable, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { isObservable, lastValueFrom } from 'rxjs';
import { PUBLIC_ROUTE } from '../decorators/public.decorator';
import { REQUIRED_ROLES } from '../decorators/roles.decorator';
import type { AdminRole, AuthenticatedAdmin } from '../types/security.types';

@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, targets) === true) {
      if (
        this.reflector.getAllAndOverride<readonly AdminRole[]>(REQUIRED_ROLES, targets) !==
        undefined
      ) {
        throw new Error('A route cannot be both public and role-restricted.');
      }
      return true;
    }
    const result = super.canActivate(context);
    return isObservable(result) ? lastValueFrom(result) : result;
  }

  override handleRequest<TUser = AuthenticatedAdmin>(
    error: unknown,
    user: TUser | false | null,
    info: unknown,
  ): TUser {
    if (error) throw error;
    if (!user) {
      const expired =
        typeof info === 'object' &&
        info !== null &&
        'name' in info &&
        info.name === 'TokenExpiredError';
      throw new UnauthorizedException({
        code: expired ? 'ACCESS_TOKEN_EXPIRED' : 'ACCESS_TOKEN_INVALID',
        message: expired ? 'Access token expired.' : 'Valid access token required.',
      });
    }
    return user;
  }
}
