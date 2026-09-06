import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthHttpPolicy } from '../../src/modules/auth/auth-http.policy';
import { AuthRequestGuard } from '../../src/modules/auth/auth-request.guard';
import { SecurityTokenService } from '../../src/modules/security/services/security-token.service';

describe('Auth quota isolation', () => {
  const verifyRefresh = jest.fn();
  let guard: AuthRequestGuard;
  const context = (ip: string, action = 'login', cookie?: string) =>
    ({
      getHandler: () => ({ name: action }),
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          ip,
          headers: {
            origin: 'https://store.example.test',
            cookie,
            'x-forwarded-for': '203.0.113.99',
          },
        }),
        getResponse: () => ({ setHeader: jest.fn() }),
      }),
    }) as unknown as ExecutionContext;
  beforeEach(() => {
    verifyRefresh.mockReset();
    guard = new AuthRequestGuard(
      new AuthHttpPolicy(new ConfigService({ AUTH_ALLOWED_ORIGINS: 'https://store.example.test' })),
      { verifyRefresh } as unknown as SecurityTokenService,
    );
  });
  afterEach(() => jest.restoreAllMocks());

  it('one source cannot exhaust another source and forwarded headers do not bypass a source limit', async () => {
    for (let i = 0; i < 5; i++) await guard.canActivate(context('192.0.2.1'));
    await expect(guard.canActivate(context('192.0.2.1'))).rejects.toMatchObject({ status: 429 });
    await expect(guard.canActivate(context('192.0.2.2'))).resolves.toBe(true);
  });
  it('maps IPv4-mapped addresses to the same quota and resets expired windows', async () => {
    const time = jest.spyOn(Date, 'now').mockReturnValue(1000);
    for (let i = 0; i < 5; i++) await guard.canActivate(context('::ffff:192.0.2.1'));
    await expect(guard.canActivate(context('192.0.2.1'))).rejects.toMatchObject({ status: 429 });
    time.mockReturnValue(61_001);
    await expect(guard.canActivate(context('192.0.2.1'))).resolves.toBe(true);
  });
  it('invalid refresh requests never spend the authenticated session quota', async () => {
    verifyRefresh.mockRejectedValue(new UnauthorizedException());
    for (let i = 0; i < 30; i++)
      await guard.canActivate(
        context('192.0.2.1', 'refresh', '__Secure-bookstore-refresh=invalid'),
      );
    verifyRefresh.mockResolvedValue({ sid: 'verified-session', ver: 1 });
    await expect(
      guard.canActivate(context('192.0.2.2', 'refresh', '__Secure-bookstore-refresh=valid')),
    ).resolves.toBe(true);
  });
  it('verified session quota spans different sources', async () => {
    verifyRefresh.mockResolvedValue({ sid: 'verified-session', ver: 1 });
    for (let i = 0; i < 30; i++)
      await guard.canActivate(context('192.0.2.1', 'refresh', '__Secure-bookstore-refresh=valid'));
    await expect(
      guard.canActivate(context('192.0.2.2', 'refresh', '__Secure-bookstore-refresh=valid')),
    ).rejects.toMatchObject({ status: 429 });
  });
});
