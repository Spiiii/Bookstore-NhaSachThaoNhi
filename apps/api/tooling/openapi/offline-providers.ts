import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { STORAGE_ADAPTER } from '../../src/infrastructure/storage/storage-adapter.interface';
import { LocalStorageAdapter } from '../../src/infrastructure/storage/adapters/local-storage.adapter';
import { PasswordService } from '../../src/infrastructure/credentials/password.service';

export function forbiddenOfflineCall(): never {
  throw new Error('OpenAPI export attempted data/credential I/O.');
}
const delegate = new Proxy(
  {},
  { get: (_target, key) => (key === 'then' ? undefined : forbiddenOfflineCall) },
);
export const offlinePrisma = {
  user: delegate,
  category: delegate,
  brand: delegate,
  product: delegate,
  productImage: delegate,
  productAttribute: delegate,
  productMarketplaceLink: delegate,
  news: delegate,
  banner: delegate,
  $connect: forbiddenOfflineCall,
  $disconnect: forbiddenOfflineCall,
  $transaction: forbiddenOfflineCall,
  $queryRaw: forbiddenOfflineCall,
  $executeRaw: forbiddenOfflineCall,
};
export const offlineStorage = {
  put: forbiddenOfflineCall,
  read: forbiddenOfflineCall,
  delete: forbiddenOfflineCall,
};

export function offlineConfig() {
  const values: Readonly<Record<string, unknown>> = Object.freeze({
    // Deterministic TOOLING-ONLY values, never accepted as a runtime configuration fallback.
    JWT_ACCESS_SECRET: Buffer.alloc(32, 1).toString('base64'),
    JWT_REFRESH_SECRET: Buffer.alloc(32, 2).toString('base64'),
    JWT_ISSUER: 'bookstore-offline-export',
    JWT_ACCESS_AUDIENCE: 'offline-access',
    JWT_REFRESH_AUDIENCE: 'offline-refresh',
    AUTH_ALLOWED_ORIGINS: 'https://bookstore.invalid',
    AUTH_COOKIE_PATH: '/auth',
    AUTH_COOKIE_SAME_SITE: 'strict',
    BANNER_PLACEMENTS: 'home-hero',
    UPLOAD_MAX_BYTES: 5242880,
    UPLOAD_MAX_PIXELS: 16000000,
    UPLOAD_MAX_CONCURRENT: 2,
  });
  return {
    get<T = unknown>(key: string, fallback?: T): T | undefined {
      return (values[key] ?? fallback) as T | undefined;
    },
    getOrThrow<T = unknown>(key: string): T {
      if (values[key] === undefined) throw new Error(`Missing offline configuration: ${key}`);
      return values[key] as T;
    },
  };
}
export function offlineAppBuilder() {
  return Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ConfigService)
    .useValue(offlineConfig())
    .overrideProvider(PrismaService)
    .useValue(offlinePrisma)
    .overrideProvider(STORAGE_ADAPTER)
    .useValue(offlineStorage)
    .overrideProvider(LocalStorageAdapter)
    .useValue(offlineStorage)
    .overrideProvider(PasswordService)
    .useValue({ hash: forbiddenOfflineCall, verify: forbiddenOfflineCall });
}
