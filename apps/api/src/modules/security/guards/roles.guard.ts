import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PUBLIC_ROUTE } from '../decorators/public.decorator';
import { REQUIRED_ROLES } from '../decorators/roles.decorator';
import type { AdminRole, SecurityRequest } from '../types/security.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const roles = this.reflector.getAllAndOverride<readonly AdminRole[]>(REQUIRED_ROLES, targets);
    if (
      this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, targets) === true &&
      roles === undefined
    )
      return true;
    const admin = context.switchToHttp().getRequest<SecurityRequest>().user;
    if (!admin || admin.role !== 'ADMIN' || (roles !== undefined && !roles.includes(admin.role))) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Insufficient permission.' });
    }
    return true;
  }
}
