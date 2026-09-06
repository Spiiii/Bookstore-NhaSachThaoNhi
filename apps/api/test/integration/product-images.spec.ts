import { randomUUID } from 'node:crypto';
import { CatalogService } from '../../src/modules/catalog/catalog.service';
import { ImageObjectsService } from '../../src/modules/catalog/images/image-objects.service';
import type { AuthenticatedAdmin } from '../../src/modules/security/types/security.types';
import { IdentityReaderService } from '../../src/modules/users/identity-reader.service';
import { UsersService } from '../../src/modules/users/users.service';
import { AdminPostgresFixture } from '../helpers/admin-postgres.fixture';

describe('Product publication/image PostgreSQL invariants', () => {
  const db = new AdminPostgresFixture();
  let catalog: CatalogService;
  let admin: AuthenticatedAdmin;

  beforeAll(() => db.start(), 60_000);
  beforeEach(async () => {
    await db.reset();
    await db.seed();
    await db.auth.login({ email: db.email, password: db.password });
    const identity = await new IdentityReaderService(db.runtime).readCurrentIdentity();
    if (!identity?.sessionId || !identity.sessionExpiresAt) throw new Error('Missing active admin session.');
    admin = { ...identity, sessionId: identity.sessionId, sessionExpiresAt: identity.sessionExpiresAt };
    catalog = new CatalogService(
      db.runtime,
      new UsersService(db.runtime),
      { read: jest.fn().mockResolvedValue({ bytes: Buffer.from('image'), mime: 'image/png' }) } as unknown as ImageObjectsService,
    );
  });
  afterAll(() => db.stop(), 30_000);

  async function productWithImage() {
    return db.runtime.product.create({
      data: {
        sku: `E2E-${randomUUID()}`,
        name: 'Concurrent product',
        slug: `concurrent-${randomUUID()}`,
        images: { create: { storageKey: randomUUID(), isPrimary: true } },
      },
      include: { images: true },
    });
  }

  it('publish racing last-image deletion never commits a public product without an image', async () => {
    const product = await productWithImage();
    const outcomes = await Promise.allSettled([
      catalog.publish(admin, product.id, true),
      catalog.removeImage(admin, product.id, product.images[0]!.id),
    ]);
    expect(outcomes.some((outcome) => outcome.status === 'rejected')).toBe(true);
    const stored = await db.runtime.product.findUniqueOrThrow({ where: { id: product.id }, include: { images: true } });
    expect(stored.isActive && stored.images.length === 0).toBe(false);
  });

  it('concurrent primary-image assignments leave exactly one primary image', async () => {
    const product = await productWithImage();
    await Promise.all([
      catalog.attachImage(admin, product.id, { storageKey: randomUUID(), isPrimary: true }),
      catalog.attachImage(admin, product.id, { storageKey: randomUUID(), isPrimary: true }),
    ]);
    expect(await db.runtime.productImage.count({ where: { productId: product.id, isPrimary: true } })).toBe(1);
  });
});
