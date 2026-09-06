import {
  Inject,
  Injectable,
  Optional,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

export const REGISTER_PRISMA_RESOURCE = Symbol('REGISTER_PRISMA_RESOURCE');
export type RegisterPrismaResource = (resource: PrismaService) => void;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private closePromise?: Promise<void>;

  constructor(
    config: ConfigService,
    @Optional() @Inject(REGISTER_PRISMA_RESOURCE) register?: RegisterPrismaResource,
  ) {
    const connectionString = config.getOrThrow<string>('DATABASE_URL');
    if (typeof connectionString !== 'string' || connectionString.trim() !== connectionString) {
      throw new TypeError('DATABASE_URL must be a valid PostgreSQL connection URL.');
    }
    try {
      const url = new URL(connectionString);
      if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname) {
        throw new TypeError();
      }
    } catch {
      // Never include URL input or the URL parser's error cause: it may contain credentials.
      throw new TypeError('DATABASE_URL must be a valid PostgreSQL connection URL.');
    }

    const adapter = new PrismaPg({ connectionString, connectionTimeoutMillis: 10_000 });
    super({ adapter });
    register?.(this);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch (error) {
      try {
        await this.close();
      } catch {
        /* Preserve the initialization failure. */
      }
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  close(): Promise<void> {
    return (this.closePromise ??= this.$disconnect());
  }
}
