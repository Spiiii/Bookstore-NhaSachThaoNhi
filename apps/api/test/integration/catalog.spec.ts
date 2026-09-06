import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { STORAGE_ADAPTER } from '../../src/infrastructure/storage/storage-adapter.interface';
import { CatalogModule } from '../../src/modules/catalog/catalog.module';
import { CatalogService } from '../../src/modules/catalog/catalog.service';
import { SecurityTokenService } from '../../src/modules/security/services/security-token.service';
import { IdentityReaderService } from '../../src/modules/users/identity-reader.service';

const id = '11111111-1111-4111-8111-111111111111';
describe('Catalog HTTP boundaries', () => {
  const methods = [
    'list',
    'detail',
    'image',
    'create',
    'update',
    'publish',
    'remove',
    'attachImage',
    'updateImage',
    'removeImage',
    'addAttribute',
    'updateAttribute',
    'removeAttribute',
    'setMarketplace',
    'removeMarketplace',
  ] as const;
  const service = Object.fromEntries(methods.map((method) => [method, jest.fn()]));
  const identity = {
    id,
    email: 'admin@example.test',
    displayName: 'Admin',
    role: 'ADMIN',
    authVersion: 1,
    sessionId: '22222222-2222-4222-8222-222222222222',
    sessionExpiresAt: new Date(Date.now() + 3600000),
  };
  let app: INestApplication;
  let base: string;
  let access: string;
  const request = (path: string, method = 'GET', body?: unknown, authenticated = false) =>
    fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authenticated ? { Authorization: 'Bearer ' + access } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  beforeAll(async () => {
    const config = new ConfigService({
      JWT_ACCESS_SECRET: randomBytes(32).toString('base64'),
      JWT_REFRESH_SECRET: randomBytes(32).toString('base64'),
      JWT_ISSUER: 'catalog-tests',
      JWT_ACCESS_AUDIENCE: 'access',
      JWT_REFRESH_AUDIENCE: 'refresh',
      STORAGE_LOCAL_ROOT: process.cwd(),
    });
    const module = await Test.createTestingModule({ imports: [CatalogModule] })
      .overrideProvider(ConfigService)
      .useValue(config)
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(STORAGE_ADAPTER)
      .useValue({})
      .overrideProvider(IdentityReaderService)
      .useValue({ readCurrentIdentity: async () => identity })
      .overrideProvider(CatalogService)
      .useValue(service)
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
    access = await app.get(SecurityTokenService).signAccess({
      adminId: id,
      sessionId: identity.sessionId,
      authVersion: 1,
      sessionExpiresAt: identity.sessionExpiresAt,
    });
  });
  beforeEach(() => {
    for (const method of methods) service[method]!.mockReset().mockResolvedValue({ ok: true });
  });
  afterAll(async () => {
    await app?.close();
  });
  it('allows public browsing with bounded numeric pagination', async () => {
    expect((await request('/products?page=2&limit=5')).status).toBe(200);
    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 5 }),
      false,
    );
    expect((await request('/products?limit=1000')).status).toBe(400);
    expect((await request('/products?isActive=false')).status).toBe(400);
  });
  it('protects all admin endpoints even when imported without AuthModule', async () => {
    expect((await request('/admin/products')).status).toBe(401);
    expect((await request('/admin/products', 'POST', {})).status).toBe(401);
    expect((await request('/admin/products/' + id + '/images', 'POST', {})).status).toBe(401);
    expect(service.create).not.toHaveBeenCalled();
  });
  it('accepts a draft payload but rejects mass assignment and invalid prices', async () => {
    const body = { sku: 'BOOK-1', name: 'Book', slug: 'book-1', referencePrice: '100000' };
    expect((await request('/admin/products', 'POST', body, true)).status).toBe(201);
    expect(
      (await request('/admin/products', 'POST', { ...body, isActive: true }, true)).status,
    ).toBe(400);
    expect(
      (await request('/admin/products', 'POST', { ...body, referencePrice: '-1' }, true)).status,
    ).toBe(400);
    expect(
      (await request('/admin/products', 'POST', { ...body, referencePrice: 100000 }, true)).status,
    ).toBe(400);
  });
  it('allows clearing nullable fields but rejects null required fields', async () => {
    expect(
      (
        await request(
          '/admin/products/' + id,
          'PATCH',
          { categoryId: null, referencePrice: null },
          true,
        )
      ).status,
    ).toBe(200);
    expect((await request('/admin/products/' + id, 'PATCH', { name: null }, true)).status).toBe(
      400,
    );
  });
  it('parses admin false literally and rejects unknown marketplace values', async () => {
    expect((await request('/admin/products?isActive=false', 'GET', undefined, true)).status).toBe(
      200,
    );
    expect(service.list).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }), true);
    expect(
      (
        await request(
          '/admin/products/' + id + '/marketplace-links/AMAZON',
          'PUT',
          { url: 'https://example.test/p' },
          true,
        )
      ).status,
    ).toBe(400);
  });
  it('validates child IDs and prevents moving children through payload fields', async () => {
    expect(
      (await request('/admin/products/' + id + '/images/not-a-uuid', 'DELETE', undefined, true))
        .status,
    ).toBe(400);
    expect(
      (
        await request(
          '/admin/products/' + id + '/attributes',
          'POST',
          { key: 'isbn', label: 'ISBN', value: '123', productId: id },
          true,
        )
      ).status,
    ).toBe(400);
  });
  it('streams public image content with nosniff rather than exposing a disk path', async () => {
    service.image!.mockResolvedValue({ bytes: Buffer.from('test'), mime: 'image/png' });
    const response = await request('/products/book/images/' + id);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('image/png');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(await response.text()).toBe('test');
  });
});
