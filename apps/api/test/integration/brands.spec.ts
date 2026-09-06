import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { STORAGE_ADAPTER } from '../../src/infrastructure/storage/storage-adapter.interface';
import { BrandsModule } from '../../src/modules/brands/brands.module';
import { BrandsService } from '../../src/modules/brands/brands.service';
import { IdentityReaderService } from '../../src/modules/users/identity-reader.service';
import { SecurityTokenService } from '../../src/modules/security/services/security-token.service';

const id = '11111111-1111-4111-8111-111111111111';
describe('Brands HTTP validation and authorization', () => {
  const service = {
    list: jest.fn(),
    detail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    logo: jest.fn(),
  };
  let app: INestApplication;
  let base: string;
  let access: string;
  const request = (url: string, method = 'GET', body?: unknown, authenticated = false) =>
    fetch(base + url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authenticated ? { Authorization: 'Bearer ' + access } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  beforeAll(async () => {
    const identity = {
      id,
      email: 'admin@example.test',
      displayName: 'Admin',
      role: 'ADMIN',
      authVersion: 1,
      sessionId: '22222222-2222-4222-8222-222222222222',
      sessionExpiresAt: new Date(Date.now() + 3600000),
    };
    const config = new ConfigService({
      STORAGE_LOCAL_ROOT: process.cwd(),
      JWT_ACCESS_SECRET: randomBytes(32).toString('base64'),
      JWT_REFRESH_SECRET: randomBytes(32).toString('base64'),
      JWT_ISSUER: 'brands-test',
      JWT_ACCESS_AUDIENCE: 'access',
      JWT_REFRESH_AUDIENCE: 'refresh',
    });
    const module = await Test.createTestingModule({ imports: [BrandsModule] })
      .overrideProvider(ConfigService)
      .useValue(config)
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(STORAGE_ADAPTER)
      .useValue({})
      .overrideProvider(BrandsService)
      .useValue(service)
      .overrideProvider(IdentityReaderService)
      .useValue({ readCurrentIdentity: async () => identity })
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
    for (const method of Object.values(service)) method.mockReset().mockResolvedValue({ ok: true });
  });
  afterAll(async () => {
    await app?.close();
  });
  it('allows public list/detail but rejects public inactive filters', async () => {
    expect((await request('/brands?page=2&limit=5')).status).toBe(200);
    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 5 }),
      false,
    );
    expect((await request('/brands/by-slug/brand')).status).toBe(200);
    expect((await request('/brands?isActive=false')).status).toBe(400);
  });
  it('protects admin CRUD and logo preview', async () => {
    expect((await request('/admin/brands')).status).toBe(401);
    expect((await request('/admin/brands', 'POST', { name: 'Brand', slug: 'brand' })).status).toBe(
      401,
    );
    expect((await request('/admin/brands/' + id + '/logo')).status).toBe(401);
    expect(service.create).not.toHaveBeenCalled();
  });
  it('accepts valid create and rejects mass assignment, HTTP and non-object storage keys', async () => {
    const body = { name: 'Brand', slug: 'brand', websiteUrl: 'https://example.test' };
    expect((await request('/admin/brands', 'POST', body, true)).status).toBe(201);
    expect((await request('/admin/brands', 'POST', { ...body, products: [] }, true)).status).toBe(
      400,
    );
    expect(
      (await request('/admin/brands', 'POST', { ...body, websiteUrl: 'http://example.test' }, true))
        .status,
    ).toBe(400);
    expect(
      (await request('/admin/brands', 'POST', { ...body, logoKey: '../../file' }, true)).status,
    ).toBe(400);
  });
  it('allows nullable fields to be cleared but rejects null name or flags', async () => {
    expect(
      (await request('/admin/brands/' + id, 'PATCH', { logoKey: null, websiteUrl: null }, true))
        .status,
    ).toBe(200);
    expect((await request('/admin/brands/' + id, 'PATCH', { name: null }, true)).status).toBe(400);
    expect((await request('/admin/brands/' + id, 'PATCH', { isActive: null }, true)).status).toBe(
      400,
    );
  });
  it('parses false correctly, validates IDs and returns 204 for delete', async () => {
    expect((await request('/admin/brands?isActive=false', 'GET', undefined, true)).status).toBe(
      200,
    );
    expect(service.list).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }), true);
    expect((await request('/admin/brands/invalid', 'DELETE', undefined, true)).status).toBe(400);
    service.remove.mockResolvedValue(undefined);
    expect((await request('/admin/brands/' + id, 'DELETE', undefined, true)).status).toBe(204);
  });
  it('streams public logo with explicit MIME type and nosniff', async () => {
    service.logo.mockResolvedValue({ bytes: Buffer.from('logo'), mime: 'image/png' });
    const response = await request('/brands/by-slug/brand/logo');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('image/png');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(await response.text()).toBe('logo');
  });
});
