import { SetMetadata } from '@nestjs/common';
import type { AdminRole } from '../types/security.types';

export const REQUIRED_ROLES = Symbol('REQUIRED_ROLES');
export const Roles = (...roles: AdminRole[]) =>
  SetMetadata(REQUIRED_ROLES, Object.freeze([...roles]));
