import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type {
  OpenAPIObject,
  OperationObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { exportDocument } from '../../tooling/openapi/export-document';
import {
  offlineConfig,
  offlinePrisma,
  offlineStorage,
} from '../../tooling/openapi/offline-providers';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { PasswordService } from '../../src/infrastructure/credentials/password.service';

describe('Offline OpenAPI contract export', () => {
  let document: OpenAPIObject;
  beforeAll(async () => {
    document = JSON.parse(await exportDocument()) as OpenAPIObject;
  }, 30000);
  it('covers every implemented module without user creation or catalogue tables', () => {
    for (const path of [
      '/auth/login',
      '/auth/me',
      '/auth/refresh',
      '/auth/logout',
      '/auth/change-password',
      '/products',
      '/categories',
      '/brands',
      '/news',
      '/banners',
      '/admin/uploads',
      '/health/live',
      '/health/ready',
    ])
      expect(document.paths[path]).toBeDefined();
    expect(
      Object.keys(document.paths).some((path) =>
        /register|users|catalogues|authors|publishers/.test(path),
      ),
    ).toBe(false);
    const ids = new Set<string>();
    for (const path of Object.values(document.paths))
      for (const [method, value] of Object.entries(path))
        if (['get', 'post', 'patch', 'put', 'delete'].includes(method)) {
          const operation = value as OperationObject;
          expect(operation.operationId).toBeDefined();
          expect(ids.has(operation.operationId!)).toBe(false);
          ids.add(operation.operationId!);
          for (const security of operation.security ?? [])
            for (const key of Object.keys(security))
              expect(document.components?.securitySchemes?.[key]).toBeDefined();
        }
  });
  it('exports current auth, upload and scheduling request contracts', () => {
    expect(document.paths['/admin/uploads']?.post?.requestBody).toMatchObject({
      content: {
        'multipart/form-data': {
          schema: {
            required: ['file'],
            properties: { file: { type: 'string', format: 'binary' } },
          },
        },
      },
    });
    const schemas = document.components!.schemas!;
    const banner = schemas.CreateBannerDto as SchemaObject;
    expect(banner.properties?.startAt).toMatchObject({
      type: 'string',
      nullable: true,
      format: 'date-time',
    });
    expect(banner.properties).not.toHaveProperty('startsAt');
    expect((schemas.CreateNewsDto as SchemaObject).properties).not.toHaveProperty('authorId');
    expect((schemas.NewsPublicationDto as SchemaObject).properties?.status).toMatchObject({
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    });
    expect(document.paths['/auth/refresh']?.post?.security).toContainEqual({
      '__Secure-bookstore-refresh': [],
    });
    expect(document.paths['/auth/login']?.post?.parameters).toContainEqual(
      expect.objectContaining({ name: 'Origin', in: 'header', required: true }),
    );
  });
  it('resolves all local schema references', () => {
    function visit(value: unknown) {
      if (!value || typeof value !== 'object') return;
      if ('$ref' in value && typeof value.$ref === 'string') {
        expect(value.$ref.startsWith('#/')).toBe(true);
        let resolved: unknown = document;
        for (const key of value.$ref.slice(2).split('/'))
          resolved = (resolved as Record<string, unknown>)[
            key.replaceAll('~1', '/').replaceAll('~0', '~')
          ];
        expect(resolved).toBeDefined();
      }
      for (const entry of Object.values(value)) visit(entry);
    }
    visit(document);
  });
  it('matches the generated snapshot and does not run runtime initialization', async () => {
    const connect = jest.spyOn(PrismaService.prototype, 'onModuleInit');
    const hash = jest.spyOn(PasswordService.prototype, 'hash');
    try {
      const json = await exportDocument();
      expect(JSON.parse(json)).toEqual(document);
      expect(
        JSON.parse(
          await readFile(
            resolve('../../packages/contracts/openapi/bookstore.openapi.json'),
            'utf8',
          ),
        ),
      ).toEqual(document);
      expect(connect).not.toHaveBeenCalled();
      expect(hash).not.toHaveBeenCalled();
    } finally {
      connect.mockRestore();
      hash.mockRestore();
    }
  });
  it('never falls back to process environment and rejects data I/O', () => {
    const previous = process.env.DATABASE_URL;
    try {
      process.env.DATABASE_URL = 'canary-not-a-database';
      expect(offlineConfig().get('DATABASE_URL')).toBeUndefined();
      expect(() => offlineConfig().getOrThrow('DATABASE_URL')).toThrow();
    } finally {
      if (previous === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previous;
    }
    expect(() => offlinePrisma.$connect()).toThrow('I/O');
    expect(() => offlineStorage.read()).toThrow('I/O');
  });
});
