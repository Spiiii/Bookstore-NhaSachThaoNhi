import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const CREDENTIAL_SELECT = {
  id: true,
  role: true,
  authVersion: true,
  passwordHash: true,
} satisfies Prisma.UserSelect;

const IDENTITY_SELECT = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  authVersion: true,
  sessionId: true,
  sessionExpiresAt: true,
} satisfies Prisma.UserSelect;

export type LoginCredential = Prisma.UserGetPayload<{ select: typeof CREDENTIAL_SELECT }>;
export type CurrentIdentity = Prisma.UserGetPayload<{ select: typeof IDENTITY_SELECT }>;

@Injectable()
export class IdentityReaderService {
  constructor(private readonly prisma: PrismaService) {}

  /** Credential-only projection for internal login verification, never an API response. */
  findLoginCredential(email: string): Promise<LoginCredential | null> {
    if (typeof email !== 'string') throw new TypeError('Email must be a string.');
    return this.prisma.user.findUnique({
      where: { singletonKey: 1, email: email.trim().toLowerCase() },
      select: CREDENTIAL_SELECT,
    });
  }

  /** Always reads the configured primary database; no process cache or replica fallback. */
  readCurrentIdentity(): Promise<CurrentIdentity | null> {
    return this.prisma.user.findUnique({ where: { singletonKey: 1 }, select: IDENTITY_SELECT });
  }
}
