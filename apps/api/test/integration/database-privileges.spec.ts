import { assertOperationalDatabase } from '../../operations/bootstrap';
import { AdminPostgresFixture } from '../helpers/admin-postgres.fixture';

describe('Least-privilege PostgreSQL roles', () => {
  const db = new AdminPostgresFixture();
  beforeAll(() => db.start(), 60_000);
  beforeEach(() => db.reset());
  afterAll(() => db.stop(), 30_000);

  it('passes fail-closed setup and recovery role preflight', async () => {
    await expect(assertOperationalDatabase(db.setup, 'setup', db.names.setup)).resolves.toBeUndefined();
    await expect(assertOperationalDatabase(db.recovery, 'recovery', db.names.recovery)).resolves.toBeUndefined();
  });

  it('prevents every application role from deleting or truncating the singleton', async () => {
    await db.seed();
    for (const client of [db.runtime, db.setup, db.recovery]) {
      await expect(client.$executeRaw`DELETE FROM users`).rejects.toBeDefined();
      await expect(client.$executeRaw`TRUNCATE TABLE users`).rejects.toBeDefined();
    }
    expect(await db.runtime.user.count()).toBe(1);
  });

  it('protects identity and role columns and separates setup/recovery/runtime capabilities', async () => {
    await db.seed();
    for (const client of [db.runtime, db.setup, db.recovery]) {
      await expect(client.$executeRaw`UPDATE users SET role = 'ADMIN'`).rejects.toBeDefined();
      await expect(client.$executeRaw`UPDATE users SET singleton_key = 1`).rejects.toBeDefined();
      await expect(client.$executeRaw`UPDATE users SET id = id`).rejects.toBeDefined();
    }
    await expect(db.setup.$executeRaw`UPDATE users SET password_hash = 'forbidden'`).rejects.toBeDefined();
    await expect(db.recovery.category.create({ data: { name: 'Forbidden', slug: 'forbidden' } })).rejects.toBeDefined();
    await expect(db.runtime.category.create({ data: { name: 'Allowed', slug: 'allowed' } })).resolves.toBeDefined();
  });
});
