import { IdentityReaderService } from '../../src/modules/users/identity-reader.service';
import { AdminPostgresFixture } from '../helpers/admin-postgres.fixture';

describe('Singleton session concurrency', () => {
  const db = new AdminPostgresFixture();
  beforeAll(() => db.start(), 60_000);
  beforeEach(() => db.reset());
  afterAll(() => db.stop(), 30_000);

  it('concurrent logins leave exactly one access token usable', async () => {
    await db.seed();
    const old = await db.auth.login({ email: db.email, password: db.password });
    const outcomes = await Promise.allSettled([
      db.auth.login({ email: db.email, password: db.password }),
      db.auth.login({ email: db.email, password: db.password }),
    ]);
    const tokens = outcomes.flatMap((outcome) => outcome.status === 'fulfilled' ? [outcome.value] : []);
    expect(tokens.length).toBeGreaterThan(0);
    const statuses = await Promise.all(tokens.map(async (token) => (await db.profile(token.accessToken)).status));
    expect(statuses.filter((status) => status === 200)).toHaveLength(1);
    expect((await db.profile(old.accessToken)).status).toBe(401);
  });

  it('logout with an old refresh token cannot revoke the newly committed session', async () => {
    await db.seed();
    const old = await db.auth.login({ email: db.email, password: db.password });
    const current = await db.auth.login({ email: db.email, password: db.password });
    await db.auth.logout(old.refreshToken, 'refresh');
    expect((await db.profile(current.accessToken)).status).toBe(200);
  });

  it('concurrent refresh replay commits revocation and invalidates winner and original access', async () => {
    await db.seed();
    const original = await db.auth.login({ email: db.email, password: db.password });
    const outcomes = await Promise.allSettled([
      db.auth.refresh(original.refreshToken),
      db.auth.refresh(original.refreshToken),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    const winner = outcomes.find((outcome) => outcome.status === 'fulfilled');
    if (!winner || winner.status !== 'fulfilled') throw new Error('Missing refresh winner');
    expect((await db.profile(original.accessToken)).status).toBe(401);
    expect((await db.profile(winner.value.accessToken)).status).toBe(401);
    expect(await db.runtime.user.findUniqueOrThrow({ where: { singletonKey: 1 } })).toMatchObject({ sessionId: null, refreshGeneration: 0 });
  });

  it('password replacement racing refresh cannot revive the old session', async () => {
    await db.seed();
    const original = await db.auth.login({ email: db.email, password: db.password });
    const identity = await new IdentityReaderService(db.runtime).readCurrentIdentity();
    if (!identity?.sessionId || !identity.sessionExpiresAt) throw new Error('Missing active identity');
    const changed = 'a different long integration password';
    const outcomes = await Promise.allSettled([
      db.auth.changePassword({ ...identity, sessionId: identity.sessionId, sessionExpiresAt: identity.sessionExpiresAt }, { currentPassword: db.password, newPassword: changed }),
      db.auth.refresh(original.refreshToken),
    ]);
    expect(outcomes[0]?.status).toBe('fulfilled');
    expect((await db.profile(original.accessToken)).status).toBe(401);
    if (outcomes[1]?.status === 'fulfilled') expect((await db.profile(outcomes[1].value.accessToken)).status).toBe(401);
    await expect(db.auth.login({ email: db.email, password: db.password })).rejects.toBeDefined();
    await expect(db.auth.login({ email: db.email, password: changed })).resolves.toBeDefined();
  });
});
