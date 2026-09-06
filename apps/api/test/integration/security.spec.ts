import { Controller, Get, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { IdentityReaderService } from '../../src/modules/users/identity-reader.service';
import { CurrentAdmin } from '../../src/modules/security/decorators/current-admin.decorator';
import { Protected, Public } from '../../src/modules/security/decorators/public.decorator';
import { Roles } from '../../src/modules/security/decorators/roles.decorator';
import { SecurityModule } from '../../src/modules/security/security.module';
import { JwtPolicy } from '../../src/modules/security/services/jwt-policy.service';
import { SecurityTokenService } from '../../src/modules/security/services/security-token.service';
import type {
  AuthenticatedAdmin,
  TokenSession,
} from '../../src/modules/security/types/security.types';

// HTTP fixtures only; no application/auth endpoints are implemented by this test.
@Controller('security-probe')
class ProbeController {
  @Get('public') @Public() publicRoute() {
    return { public: true };
  }
  @Get('private') privateRoute(@CurrentAdmin() admin: AuthenticatedAdmin) {
    return admin;
  }
  @Get('admin') @Roles('ADMIN') adminRoute() {
    return { allowed: true };
  }
  @Get('denied') @Roles() deniedRoute() {
    return { unreachable: true };
  }
  @Get('conflict') @Public() @Roles('ADMIN') conflict() {
    return { unreachable: true };
  }
}

@Public()
@Controller('public-probe')
class PublicProbeController {
  @Get('private') @Protected() privateRoute() {
    return { protected: true };
  }
}

describe('Security JWT and HTTP enforcement', () => {
  const settings = {
    JWT_ACCESS_SECRET: randomBytes(32).toString('base64'),
    JWT_REFRESH_SECRET: randomBytes(32).toString('base64'),
    JWT_ISSUER: 'bookstore-test',
    JWT_ACCESS_AUDIENCE: 'bookstore-access-test',
    JWT_REFRESH_AUDIENCE: 'bookstore-refresh-test',
  };
  const policy = new JwtPolicy(new ConfigService(settings));
  const signer = new JwtService();
  const identities = { readCurrentIdentity: jest.fn() };
  const session: TokenSession = {
    adminId: '11111111-1111-4111-8111-111111111111',
    sessionId: '22222222-2222-4222-8222-222222222222',
    authVersion: 7,
    sessionExpiresAt: new Date(Date.now() + 3_600_000),
  };
  let app: INestApplication;
  let tokens: SecurityTokenService;
  let base: string;

  const identity = () => ({
    id: session.adminId,
    sessionId: session.sessionId,
    authVersion: 7,
    role: 'ADMIN',
    email: 'admin@example.test',
    displayName: 'Admin',
    sessionExpiresAt: session.sessionExpiresAt,
  });
  const request = (route: string, token?: string) =>
    fetch(
      base + route,
      token === undefined ? {} : { headers: { Authorization: `Bearer ${token}` } },
    );
  const signed = (
    patch: Record<string, unknown>,
    algorithm: 'HS256' | 'HS384' = 'HS256',
    options: JwtSignOptions = {},
  ) => {
    const now = Math.floor(Date.now() / 1000);
    return signer.signAsync(
      {
        sub: session.adminId,
        sid: session.sessionId,
        ver: 7,
        purpose: 'access',
        iat: now,
        exp: now + 600,
        ...patch,
      },
      {
        secret: policy.accessKey,
        algorithm,
        issuer: policy.issuer,
        audience: policy.accessAudience,
        ...options,
      },
    );
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [SecurityModule],
      controllers: [ProbeController, PublicProbeController],
    })
      .overrideProvider(ConfigService)
      .useValue(new ConfigService(settings))
      .overrideProvider(IdentityReaderService)
      .useValue(identities)
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
    tokens = app.get(SecurityTokenService);
  });
  beforeEach(() => {
    identities.readCurrentIdentity.mockReset().mockResolvedValue(identity());
  });
  afterAll(async () => {
    await app?.close();
  });

  it('requires authentication by default and honors explicit public metadata', async () => {
    expect((await request('/security-probe/private')).status).toBe(401);
    expect((await request('/security-probe/public')).status).toBe(200);
    expect(identities.readCurrentIdentity).not.toHaveBeenCalled();
    expect((await request('/public-probe/private')).status).toBe(401);
  });

  it('runs JWT before RBAC and exposes only the DB-derived principal', async () => {
    const access = await tokens.signAccess(session);
    const response = await request('/security-probe/private', access);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ...identity(),
      sessionExpiresAt: session.sessionExpiresAt.toISOString(),
    });
    expect((await request('/security-probe/admin', access)).status).toBe(200);
    expect((await request('/security-probe/denied', access)).status).toBe(403);
  });

  it('rejects conflicting public and role metadata instead of opening the route', async () => {
    expect((await request('/security-probe/conflict')).status).toBe(500);
    expect(identities.readCurrentIdentity).not.toHaveBeenCalled();
  });

  it('reads current state again and rejects session replacement before token expiry', async () => {
    const access = await tokens.signAccess(session);
    expect((await request('/security-probe/private', access)).status).toBe(200);
    identities.readCurrentIdentity.mockResolvedValue({ ...identity(), authVersion: 8 });
    const response = await request('/security-probe/private', access);
    expect(response.status).toBe(401);
    expect(((await response.json()) as { code: string }).code).toBe('SESSION_REPLACED');
    expect(identities.readCurrentIdentity).toHaveBeenCalledTimes(2);
  });

  it.each([
    { id: '33333333-3333-4333-8333-333333333333' },
    { sessionId: '33333333-3333-4333-8333-333333333333' },
    { sessionId: null },
    { role: 'EDITOR' },
    { sessionExpiresAt: new Date(0) },
  ])('rejects mismatched identity, role or expired session state', async (patch) => {
    identities.readCurrentIdentity.mockResolvedValue({ ...identity(), ...patch });
    expect(
      (await request('/security-probe/private', await tokens.signAccess(session))).status,
    ).toBe(401);
  });

  it('fails closed when the primary state read fails', async () => {
    identities.readCurrentIdentity.mockRejectedValue(new Error('internal database detail'));
    const response = await request('/security-probe/private', await tokens.signAccess(session));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('internal database detail');
  });

  it('separates access and refresh tokens and generates fresh 256-bit refresh jti values', async () => {
    const access = await tokens.signAccess(session);
    const first = await tokens.signRefresh(session, 2);
    const second = await tokens.signRefresh(session, 2);
    expect(first).not.toBe(second);
    const refresh = await tokens.verifyRefresh(first);
    expect(refresh.generation).toBe(2);
    expect(Buffer.from(refresh.jti, 'base64url').length).toBe(32);
    expect(refresh.exp).toBe(Math.floor(session.sessionExpiresAt.getTime() / 1000));
    await expect(tokens.verifyAccess(first)).rejects.toThrow();
    await expect(tokens.verifyRefresh(access)).rejects.toThrow();
    expect((await request('/security-probe/private', first)).status).toBe(401);
    expect(identities.readCurrentIdentity).not.toHaveBeenCalled();
  });

  it('caps access expiry at both the 15-minute policy and the absolute session deadline', async () => {
    const standard = await tokens.verifyAccess(await tokens.signAccess(session));
    expect(standard.exp - standard.iat).toBe(900);
    const short = { ...session, sessionExpiresAt: new Date(Date.now() + 30_000) };
    expect((await tokens.verifyAccess(await tokens.signAccess(short))).exp).toBe(
      Math.floor(short.sessionExpiresAt.getTime() / 1000),
    );
  });

  it('rejects a non-allowlisted signing algorithm before reading identity', async () => {
    const token = await signed({}, 'HS384');
    expect((await request('/security-probe/private', token)).status).toBe(401);
    expect(identities.readCurrentIdentity).not.toHaveBeenCalled();
  });

  it.each([
    { ver: -1 },
    { ver: '7' },
    { sub: 'invalid' },
    { purpose: 'refresh' },
    { iat: Math.floor(Date.now() / 1000) + 300 },
    { exp: Math.floor(Date.now() / 1000) + 3600 },
  ])('rejects malformed claims even with a valid access signature', async (patch) => {
    expect((await request('/security-probe/private', await signed(patch))).status).toBe(401);
    expect(identities.readCurrentIdentity).not.toHaveBeenCalled();
  });

  it('distinguishes expired access for the frontend refresh coordinator', async () => {
    const now = Math.floor(Date.now() / 1000);
    const response = await request(
      '/security-probe/private',
      await signed({ iat: now - 60, exp: now - 1 }),
    );
    expect(response.status).toBe(401);
    expect(((await response.json()) as { code: string }).code).toBe('ACCESS_TOKEN_EXPIRED');
  });

  it('does not authorize an oversized bearer token', async () => {
    expect((await request('/security-probe/private', 'a'.repeat(8193))).status).toBe(401);
    expect(identities.readCurrentIdentity).not.toHaveBeenCalled();
  });

  it.each([
    { issuer: 'wrong-issuer' },
    { audience: 'wrong-audience' },
    { secret: randomBytes(32) },
  ])('rejects incorrect issuer, audience or signing key', async (options) => {
    expect(
      (await request('/security-probe/private', await signed({}, 'HS256', options))).status,
    ).toBe(401);
    expect(identities.readCurrentIdentity).not.toHaveBeenCalled();
  });

  it('rejects unsigned tokens before querying identity', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const claims = Buffer.from(JSON.stringify({ sub: session.adminId })).toString('base64url');
    expect((await request('/security-probe/private', `${header}.${claims}.`)).status).toBe(401);
    expect(identities.readCurrentIdentity).not.toHaveBeenCalled();
  });

  it('fails closed when the singleton identity is absent', async () => {
    identities.readCurrentIdentity.mockResolvedValue(null);
    expect(
      (await request('/security-probe/private', await tokens.signAccess(session))).status,
    ).toBe(401);
  });

  it('validates refresh generation and jti even on a correctly signed token', async () => {
    const now = Math.floor(Date.now() / 1000);
    const invalid = await signer.signAsync(
      {
        sub: session.adminId,
        sid: session.sessionId,
        ver: 7,
        purpose: 'refresh',
        generation: -1,
        jti: 'invalid',
        iat: now,
        exp: now + 60,
      },
      {
        secret: policy.refreshKey,
        algorithm: 'HS256',
        issuer: policy.issuer,
        audience: policy.refreshAudience,
      },
    );
    await expect(tokens.verifyRefresh(invalid)).rejects.toThrow();
  });

  it('requires distinct explicitly provisioned signing keys and audiences', () => {
    expect(
      () => new JwtPolicy(new ConfigService({ ...settings, JWT_ACCESS_SECRET: 'short' })),
    ).toThrow(TypeError);
    expect(
      () =>
        new JwtPolicy(
          new ConfigService({ ...settings, JWT_REFRESH_SECRET: settings.JWT_ACCESS_SECRET }),
        ),
    ).toThrow(TypeError);
    expect(
      () =>
        new JwtPolicy(
          new ConfigService({ ...settings, JWT_REFRESH_AUDIENCE: settings.JWT_ACCESS_AUDIENCE }),
        ),
    ).toThrow(TypeError);
  });
});
