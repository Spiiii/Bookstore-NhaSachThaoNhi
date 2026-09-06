import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { STORAGE_ADAPTER } from '../../src/infrastructure/storage/storage-adapter.interface';
import { NewsModule } from '../../src/modules/news/news.module';
import { NewsService } from '../../src/modules/news/news.service';
import { IdentityReaderService } from '../../src/modules/users/identity-reader.service';
import { SecurityTokenService } from '../../src/modules/security/services/security-token.service';

const id = '11111111-1111-4111-8111-111111111111';
describe('News HTTP validation and authorization', () => {
  const service = {
    list: jest.fn(),
    detail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    cover: jest.fn(),
    publication: jest.fn(),
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
      JWT_ISSUER: 'news-test',
      JWT_ACCESS_AUDIENCE: 'access',
      JWT_REFRESH_AUDIENCE: 'refresh',
    });
    const module = await Test.createTestingModule({ imports: [NewsModule] })
      .overrideProvider(ConfigService)
      .useValue(config)
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(STORAGE_ADAPTER)
      .useValue({})
      .overrideProvider(NewsService)
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

  it('exposes public reads but rejects status filter and nondecimal pagination', async () => {
    expect((await request('/news?page=2&limit=5')).status).toBe(200);
    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 5 }),
      false,
    );
    expect((await request('/news/by-slug/article')).status).toBe(200);
    expect((await request('/news?status=DRAFT')).status).toBe(400);
    expect((await request('/news?page=0x10')).status).toBe(400);
  });
  it('protects admin list, changes and cover preview', async () => {
    for (const path of ['/admin/news', '/admin/news/' + id + '/cover'])
      expect((await request(path)).status).toBe(401);
    expect(
      (await request('/admin/news/' + id + '/publication', 'PATCH', { status: 'PUBLISHED' }))
        .status,
    ).toBe(401);
    expect(service.publication).not.toHaveBeenCalled();
  });
  it('accepts Markdown and rejects ownership mass assignment', async () => {
    const body = { title: 'Article', slug: 'article', content: '# Heading' };
    expect((await request('/admin/news', 'POST', body, true)).status).toBe(201);
    for (const extra of [
      { authorId: id },
      { status: 'PUBLISHED' },
      { publishedAt: '2026-09-01T00:00:00Z' },
      { seoTitle: 'Other' },
    ])
      expect((await request('/admin/news', 'POST', { ...body, ...extra }, true)).status).toBe(400);
    expect((await request('/admin/news', 'POST', { ...body, content: '   ' }, true)).status).toBe(
      400,
    );
  });
  it('validates nullable edits and explicit timezone schedules', async () => {
    expect(
      (await request('/admin/news/' + id, 'PATCH', { excerpt: null, coverKey: null }, true)).status,
    ).toBe(200);
    expect((await request('/admin/news/' + id, 'PATCH', { content: null }, true)).status).toBe(400);
    expect(
      (
        await request(
          '/admin/news/' + id + '/publication',
          'PATCH',
          { status: 'PUBLISHED', publishedAt: '2030-01-01T07:00:00+07:00' },
          true,
        )
      ).status,
    ).toBe(200);
    for (const date of [null, '2030-01-01', '2030-01-01T00:00:00', '2030-02-30T00:00:00Z'])
      expect(
        (
          await request(
            '/admin/news/' + id + '/publication',
            'PATCH',
            { status: 'PUBLISHED', publishedAt: date },
            true,
          )
        ).status,
      ).toBe(400);
    expect(
      (await request('/admin/news/' + id + '/publication', 'PATCH', { status: 'SCHEDULED' }, true))
        .status,
    ).toBe(400);
  });
  it('supports admin status filters and delete', async () => {
    expect((await request('/admin/news?status=ARCHIVED', 'GET', undefined, true)).status).toBe(200);
    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ARCHIVED' }),
      true,
    );
    expect((await request('/admin/news/' + id, 'DELETE', undefined, true)).status).toBe(204);
  });
});
