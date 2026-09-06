import { Client } from 'pg';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Real PostgreSQL content schedule constraints', () => {
  const database = 'bookstore_test_schedule_' + randomBytes(6).toString('hex');
  let admin: Client;
  let db: Client;
  let created = false;
  let databaseUrl: string;
  beforeAll(async () => {
    const url = process.env.TEST_POSTGRES_ADMIN_URL;
    if (!url) throw new Error('TEST_POSTGRES_ADMIN_URL is required. No database tests were run.');
    admin = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
    await admin.connect();
    await admin.query(`CREATE DATABASE "${database}"`);
    created = true;
    const target = new URL(url);
    target.pathname = '/' + database;
    databaseUrl = target.toString();
    db = new Client({ connectionString: target.toString() });
    await db.connect();
    await db.query(
      readFileSync(resolve('prisma/migrations/202609030001_initial_r2/migration.sql'), 'utf8'),
    );
    await db.query(
      readFileSync(
        resolve('prisma/migrations/202609030003_content_schedule_constraints/migration.sql'),
        'utf8',
      ),
    );
    await db.query(
      `INSERT INTO users(id,email,password_hash,display_name) VALUES ('11111111-1111-4111-8111-111111111111','test@example.test','test','Test')`,
    );
  }, 30000);
  afterAll(async () => {
    await db?.end();
    if (created) await admin.query(`DROP DATABASE "${database}"`);
    await admin?.end();
  });
  it.each([
    ['DRAFT', '2030-01-01T00:00:00Z'],
    ['PUBLISHED', null],
  ])('rejects invalid News %s', async (status, published) => {
    await expect(
      db.query(
        `INSERT INTO news(id,title,slug,content,author_id,status,published_at) VALUES ('22222222-2222-4222-8222-222222222222','Title','title','Content','11111111-1111-4111-8111-111111111111',$1,$2)`,
        [status, published],
      ),
    ).rejects.toMatchObject({ code: '23514' });
  });
  it('rejects equal/reversed Banner windows and permits unbounded schedules', async () => {
    for (const end of ['2030-01-01', '2029-01-01'])
      await expect(
        db.query(
          `INSERT INTO banners(id,title,image_key,alt_text,placement,starts_at,ends_at) VALUES ('33333333-3333-4333-8333-333333333333','Title','image','','home-hero','2030-01-01',$1)`,
          [end],
        ),
      ).rejects.toMatchObject({ code: '23514' });
    await expect(
      db.query(
        `INSERT INTO banners(id,title,image_key,alt_text,placement) VALUES ('33333333-3333-4333-8333-333333333333','Title','image','','home-hero')`,
      ),
    ).resolves.toBeDefined();
  });
  it('preserves the interval when opposing partial updates race', async () => {
    const other = new Client({ connectionString: databaseUrl, statement_timeout: 5000 });
    await other.connect();
    try {
      await db.query('BEGIN');
      await db.query(
        "UPDATE banners SET starts_at='2030-01-01', ends_at=NULL WHERE id='33333333-3333-4333-8333-333333333333'",
      );
      const result = other
        .query(
          "UPDATE banners SET ends_at='2029-01-01' WHERE id='33333333-3333-4333-8333-333333333333'",
        )
        .catch((error: unknown) => error);
      await db.query('COMMIT');
      expect(await result).toMatchObject({ code: '23514' });
    } finally {
      await db.query('ROLLBACK');
      await other.end();
    }
  });
  it('aborts migration preflight rather than repairing invalid existing rows', async () => {
    // Only the disposable test database is changed here.
    await db.query('ALTER TABLE news DROP CONSTRAINT news_publication_state_check');
    await db.query('ALTER TABLE banners DROP CONSTRAINT banners_schedule_check');
    await db.query(
      "INSERT INTO news(id,title,slug,content,author_id,status,published_at) VALUES ('44444444-4444-4444-8444-444444444444','Invalid','invalid','Text','11111111-1111-4111-8111-111111111111','PUBLISHED',NULL)",
    );
    const migration = readFileSync(
      resolve('prisma/migrations/202609030003_content_schedule_constraints/migration.sql'),
      'utf8',
    );
    try {
      await expect(db.query(migration)).rejects.toThrow('News scheduling preflight failed');
    } finally {
      await db.query('ROLLBACK');
    }
    const result = await db.query("SELECT published_at FROM news WHERE slug='invalid'");
    expect(result.rows).toEqual([{ published_at: null }]);
  });
});
