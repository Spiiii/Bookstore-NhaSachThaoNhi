import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { STORAGE_ADAPTER } from '../../src/infrastructure/storage/storage-adapter.interface';
import { BannersModule } from '../../src/modules/banners/banners.module';
import { BannersService } from '../../src/modules/banners/banners.service';
import { IdentityReaderService } from '../../src/modules/users/identity-reader.service';
import { SecurityTokenService } from '../../src/modules/security/services/security-token.service';

const id = '11111111-1111-4111-8111-111111111111';
describe('Banners HTTP validation and authorization', () => {
  const service = {
    list: jest.fn(),
    detail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    image: jest.fn(),
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
      JWT_ISSUER: 'banners-test',
      JWT_ACCESS_AUDIENCE: 'access',
      JWT_REFRESH_AUDIENCE: 'refresh',
    });
    const module = await Test.createTestingModule({ imports: [BannersModule] })
      .overrideProvider(ConfigService)
      .useValue(config)
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(STORAGE_ADAPTER)
      .useValue({})
      .overrideProvider(BannersService)
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

  it('allows public reads and placement but rejects private filters', async () => {
    expect((await request('/banners?placement=home-hero&page=2&limit=5')).status).toBe(200);
    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 5, placement: 'home-hero' }),
      false,
    );
    expect((await request('/banners/' + id)).status).toBe(200);
    for (const query of ['isActive=false', 'q=internal', 'page=0x10', 'limit=51'])
      expect((await request('/banners?' + query)).status).toBe(400);
  });
  it('protects admin mutations and image preview', async () => {
    expect((await request('/admin/banners')).status).toBe(401);
    expect((await request('/admin/banners/' + id + '/image')).status).toBe(401);
    expect((await request('/admin/banners/' + id, 'DELETE')).status).toBe(401);
    expect(service.remove).not.toHaveBeenCalled();
  });
  it('validates required fields, aliases and schedule timestamps', async () => {
    const body = {
      title: 'Hero',
      imageKey: id,
      altText: '',
      placement: 'home-hero',
      startAt: '2030-01-01T00:00:00Z',
      endAt: '2030-02-01T00:00:00Z',
    };
    expect((await request('/admin/banners', 'POST', body, true)).status).toBe(201);
    for (const extra of [
      { imageKey: null },
      { altText: null },
      { isActive: null },
      { startsAt: body.startAt },
      { sortOrder: -1 },
      { startAt: '2030-02-30T00:00:00Z' },
      { endAt: '2030-02-01T00:00:00' },
    ])
      expect((await request('/admin/banners', 'POST', { ...body, ...extra }, true)).status).toBe(
        400,
      );
  });
  it('supports clearing schedules, admin filters and deletion', async () => {
    expect(
      (
        await request(
          '/admin/banners/' + id,
          'PATCH',
          { startAt: null, endAt: null, targetUrl: null },
          true,
        )
      ).status,
    ).toBe(200);
    expect((await request('/admin/banners?isActive=false', 'GET', undefined, true)).status).toBe(
      200,
    );
    expect(service.list).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }), true);
    expect((await request('/admin/banners/' + id, 'DELETE', undefined, true)).status).toBe(204);
  });
});
