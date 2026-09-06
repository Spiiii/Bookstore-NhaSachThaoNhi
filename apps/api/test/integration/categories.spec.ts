import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { CategoriesModule } from '../../src/modules/categories/categories.module';
import { CategoriesService } from '../../src/modules/categories/categories.service';
import { IdentityReaderService } from '../../src/modules/users/identity-reader.service';
import { SecurityTokenService } from '../../src/modules/security/services/security-token.service';

const id = '11111111-1111-4111-8111-111111111111';
describe('Categories HTTP and OpenAPI', () => {
  const service = {
    list: jest.fn(),
    tree: jest.fn(),
    detail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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
      JWT_ACCESS_SECRET: randomBytes(32).toString('base64'),
      JWT_REFRESH_SECRET: randomBytes(32).toString('base64'),
      JWT_ISSUER: 'categories-test',
      JWT_ACCESS_AUDIENCE: 'access',
      JWT_REFRESH_AUDIENCE: 'refresh',
    });
    const module = await Test.createTestingModule({ imports: [CategoriesModule] })
      .overrideProvider(ConfigService)
      .useValue(config)
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(CategoriesService)
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
  it('exposes public tree/list/detail without authentication', async () => {
    expect((await request('/categories/tree')).status).toBe(200);
    expect(service.tree).toHaveBeenCalledWith(false);
    expect((await request('/categories/by-slug/tree')).status).toBe(200);
    expect(service.detail).toHaveBeenCalledWith('tree', false);
    expect((await request('/categories?page=2&limit=5')).status).toBe(200);
    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 5 }),
      false,
    );
  });
  it('denies unauthenticated admin CRUD and tree', async () => {
    expect((await request('/admin/categories/tree')).status).toBe(401);
    expect(
      (await request('/admin/categories', 'POST', { name: 'Books', slug: 'books' })).status,
    ).toBe(401);
    expect((await request('/admin/categories/' + id, 'DELETE')).status).toBe(401);
    expect(service.create).not.toHaveBeenCalled();
  });
  it('validates create and rejects mass assignment or null flags', async () => {
    const body = { name: 'Books', slug: 'books', parentId: null };
    expect((await request('/admin/categories', 'POST', body, true)).status).toBe(201);
    expect((await request('/admin/categories', 'POST', { ...body, id }, true)).status).toBe(400);
    expect(
      (await request('/admin/categories', 'POST', { ...body, isActive: null }, true)).status,
    ).toBe(400);
    expect(
      (await request('/admin/categories', 'POST', { ...body, sortOrder: -1 }, true)).status,
    ).toBe(400);
  });
  it('patch clears nullable fields but cannot clear name or accept invalid UUID', async () => {
    expect(
      (
        await request(
          '/admin/categories/' + id,
          'PATCH',
          { parentId: null, description: null },
          true,
        )
      ).status,
    ).toBe(200);
    expect((await request('/admin/categories/' + id, 'PATCH', { name: null }, true)).status).toBe(
      400,
    );
    expect(
      (await request('/admin/categories/not-uuid', 'PATCH', { name: 'Name' }, true)).status,
    ).toBe(400);
  });
  it('does not allow public inactive queries or paginated partial trees', async () => {
    expect((await request('/categories?isActive=false')).status).toBe(400);
    expect((await request('/categories/tree?page=2')).status).toBe(400);
    expect((await request('/admin/categories?isActive=false', 'GET', undefined, true)).status).toBe(
      200,
    );
    expect(service.list).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }), true);
  });
  it('returns 204 for delete and produces a recursive OpenAPI tree schema', async () => {
    service.remove.mockResolvedValue(undefined);
    expect((await request('/admin/categories/' + id, 'DELETE', undefined, true)).status).toBe(204);
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
    expect(document.paths['/categories/tree']).toBeDefined();
    expect(document.components?.schemas?.CategoryTreeNodeDto).toHaveProperty('properties.children');
    expect(JSON.stringify(document)).toContain('#/components/schemas/CategoryTreeNodeDto');
  });
});
