import { createParamDecorator, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedAdmin, SecurityRequest } from '../types/security.types';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedAdmin => {
    const admin = context.switchToHttp().getRequest<SecurityRequest>().user;
    if (!admin)
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message: 'Authentication required.',
      });
    return admin;
  },
);
