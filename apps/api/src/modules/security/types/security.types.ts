import type { Request } from 'express';
import type { CurrentIdentity } from '../../users/identity-reader.service';

export type AdminRole = CurrentIdentity['role'];
export interface TokenSession {
  readonly adminId: string;
  readonly sessionId: string;
  readonly authVersion: number;
  readonly sessionExpiresAt: Date;
}
export interface AccessClaims {
  readonly sub: string;
  readonly sid: string;
  readonly ver: number;
  readonly purpose: 'access';
  readonly iat: number;
  readonly exp: number;
  readonly iss: string;
  readonly aud: string;
}
export interface RefreshClaims extends Omit<AccessClaims, 'purpose'> {
  readonly purpose: 'refresh';
  readonly generation: number;
  readonly jti: string;
}
export interface AuthenticatedAdmin {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: AdminRole;
  readonly sessionId: string;
  readonly authVersion: number;
  readonly sessionExpiresAt: Date;
}
export type SecurityRequest = Request & { user?: AuthenticatedAdmin };
