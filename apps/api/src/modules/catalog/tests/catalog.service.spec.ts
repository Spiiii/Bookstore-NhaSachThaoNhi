import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Marketplace } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import { AdminSessionRejectedError } from '../../users/types/admin-state.types';
import type { AuthenticatedAdmin } from '../../security/types/security.types';
import { CatalogService } from '../catalog.service';
import { ImageObjectsService } from '../images/image-objects.service';
import { marketplaceUrl } from '../marketplace-links/marketplace.policy';
import { productResponse, type ProductGraph } from '../catalog.mapper';

const admin = { id: 'admin', sessionId: 'session', authVersion: 1 } as AuthenticatedAdmin;
const graph = () =>
  ({
    id: 'product',
    sku: 'BOOK',
    name: 'Book',
    slug: 'book',
    summary: null,
    description: null,
    categoryId: null,
    brandId: null,
    referencePrice: null,
    currency: 'VND',
    isActive: false,
    images: [],
    attributes: [],
    marketplaceLinks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as unknown as ProductGraph;

describe('Catalog transaction ownership and invariants', () => {
  const events: string[] = [];
  const product = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  };
  const images = {
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const attributes = { create: jest.fn(), updateMany: jest.fn(), deleteMany: jest.fn() };
  const links = { upsert: jest.fn(), deleteMany: jest.fn() };
  const session = jest.fn();
  const read = jest.fn();
  const lock = jest.fn();
  const tx = {
    product,
    productImage: images,
    productAttribute: attributes,
    productMarketplaceLink: links,
    $queryRaw: lock,
  };
  const transaction = jest.fn();
  let service: CatalogService;
  beforeEach(() => {
    jest.resetAllMocks();
    events.length = 0;
    transaction.mockImplementation(async (work: (tx: unknown) => unknown) => {
      events.push('transaction');
      return work(tx);
    });
    session.mockImplementation(async () => {
      events.push('admin-lock');
    });
    lock.mockImplementation(async () => {
      events.push('product-lock');
      return [{ id: 'product' }];
    });
    read.mockImplementation(async () => {
      events.push('storage');
      return {};
    });
    product.findUniqueOrThrow.mockResolvedValue(graph());
    product.create.mockResolvedValue(graph());
    product.update.mockResolvedValue(graph());
    service = new CatalogService(
      { ...tx, $transaction: transaction } as unknown as PrismaService,
      { assertCurrentSession: session } as unknown as UsersService,
      { read } as unknown as ImageObjectsService,
    );
  });
  it('rechecks current session before product locking or publication', async () => {
    images.count.mockResolvedValue(1);
    await service.publish(admin, 'product', true);
    expect(events).toEqual(['transaction', 'admin-lock', 'product-lock']);
    expect(session).toHaveBeenCalledWith(tx, {
      adminId: 'admin',
      sessionId: 'session',
      authVersion: 1,
    });
    expect(product.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: true } }),
    );
  });
  it('refuses a stale admin before product access', async () => {
    session.mockRejectedValue(new AdminSessionRejectedError());
    await expect(service.publish(admin, 'product', true)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(lock).not.toHaveBeenCalled();
    expect(product.update).not.toHaveBeenCalled();
  });
  it('does not publish without an image but permits unpublishing', async () => {
    images.count.mockResolvedValue(0);
    await expect(service.publish(admin, 'product', true)).rejects.toBeInstanceOf(ConflictException);
    expect(product.update).not.toHaveBeenCalled();
    await expect(service.publish(admin, 'product', false)).resolves.toBeDefined();
  });
  it('refuses deletion of the last public image', async () => {
    images.findFirst.mockResolvedValue({ id: 'image' });
    images.count.mockResolvedValue(1);
    product.findUniqueOrThrow.mockResolvedValue({ ...graph(), isActive: true });
    await expect(service.removeImage(admin, 'product', 'image')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(images.delete).not.toHaveBeenCalled();
  });
  it('allows deleting a hidden image reference without deleting storage bytes', async () => {
    images.findFirst.mockResolvedValue({ id: 'image' });
    await service.removeImage(admin, 'product', 'image');
    expect(images.delete).toHaveBeenCalled();
    expect(read).not.toHaveBeenCalled();
  });
  it('validates storage before entering the transaction and changes primary image in order', async () => {
    images.updateMany.mockImplementation(async () => {
      events.push('clear-primary');
    });
    images.create.mockImplementation(async () => {
      events.push('insert-image');
    });
    await service.attachImage(admin, 'product', { storageKey: 'KEY', isPrimary: true });
    expect(events).toEqual([
      'storage',
      'transaction',
      'admin-lock',
      'product-lock',
      'clear-primary',
      'insert-image',
    ]);
  });
  it('rejects attaching missing image bytes without any database write', async () => {
    read.mockRejectedValue(new Error('missing object'));
    await expect(service.attachImage(admin, 'product', { storageKey: 'KEY' })).rejects.toThrow();
    expect(transaction).not.toHaveBeenCalled();
  });
  it('does not change another product image or attribute', async () => {
    images.findFirst.mockResolvedValue(null);
    await expect(
      service.updateImage(admin, 'product', 'foreign', { isPrimary: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(images.updateMany).not.toHaveBeenCalled();
    attributes.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.updateAttribute(admin, 'product', 'foreign', { label: 'New' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(attributes.updateMany).toHaveBeenCalledWith({
      where: { id: 'foreign', productId: 'product' },
      data: { label: 'New' },
    });
  });
  it('public queries always require active products with image references', async () => {
    product.findMany.mockResolvedValue([]);
    await service.list({ page: 1, limit: 20 }, false);
    expect(product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true, images: { some: {} } }, take: 21 }),
    );
  });
  it('upserts marketplace by product and enum instead of creating duplicate rows', async () => {
    await service.setMarketplace(admin, 'product', Marketplace.SHOPEE, {
      url: 'https://shopee.vn/product/123/456',
    });
    expect(links.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId_marketplace: { productId: 'product', marketplace: 'SHOPEE' } },
      }),
    );
  });
  it('creates only a hidden VND product with normalized SKU', async () => {
    await service.create(admin, { sku: 'book-1', name: ' Book ', slug: 'book' });
    expect(product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sku: 'BOOK-1',
          name: 'Book',
          currency: 'VND',
          isActive: false,
        }),
      }),
    );
  });
});

describe('Catalog public mapping and URL policy', () => {
  it('returns both unavailable marketplace slots and no fake URLs or storage keys', () => {
    const product = {
      ...graph(),
      images: [
        { id: 'image', storageKey: 'private-key', altText: null, sortOrder: 0, isPrimary: false },
      ],
    } as ProductGraph;
    const response = productResponse(product, false);
    expect(response.marketplaces).toEqual([
      { marketplace: 'SHOPEE', url: null, available: false, message: 'Chưa có liên kết' },
      { marketplace: 'TIKTOK_SHOP', url: null, available: false, message: 'Chưa có liên kết' },
    ]);
    expect(JSON.stringify(response)).not.toContain('private-key');
    expect(response).not.toHaveProperty('isActive');
    expect(response.referencePrice).toBeNull();
  });
  it.each([
    'http://shopee.vn/product/1/2',
    'https://shopee.vn.evil.test/product/1/2',
    'https://evil.test/?next=https://shopee.vn/product/1/2',
    'https://shopee.vn/',
    'https://user:pass@shopee.vn/product/1/2',
  ])('rejects unsafe or placeholder marketplace URL %s', (url) => {
    expect(() => marketplaceUrl(Marketplace.SHOPEE, url)).toThrow();
  });
  it('accepts supported product URLs for each marketplace', () => {
    expect(marketplaceUrl(Marketplace.SHOPEE, 'https://shopee.vn/product/1/2')).toContain(
      'shopee.vn',
    );
    expect(
      marketplaceUrl(Marketplace.TIKTOK_SHOP, 'https://www.tiktok.com/view/product/123'),
    ).toContain('tiktok.com');
  });
});
