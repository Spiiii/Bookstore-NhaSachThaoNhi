import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, type Brand } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { AuthenticatedAdmin } from '../../security/types/security.types';
import { UsersService } from '../../users/users.service';
import { AdminSessionRejectedError } from '../../users/types/admin-state.types';
import { BrandsService } from '../brands.service';
import { BrandLogoObjectsService } from '../logo-objects.service';
import { brandResponse } from '../brands.response';

const row = (): Brand => ({
  id: 'brand',
  name: 'Brand',
  slug: 'brand',
  description: null,
  logoKey: null,
  websiteUrl: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});
const admin = { id: 'admin', sessionId: 'session', authVersion: 1 } as AuthenticatedAdmin;
describe('Brands persistence and projections', () => {
  const brand = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const tx = { brand };
  const transaction = jest.fn();
  const session = jest.fn();
  const read = jest.fn();
  const events: string[] = [];
  let service: BrandsService;
  beforeEach(() => {
    jest.resetAllMocks();
    events.length = 0;
    transaction.mockImplementation(async (work: (tx: unknown) => unknown) => {
      events.push('transaction');
      return work(tx);
    });
    session.mockImplementation(async () => {
      events.push('session-lock');
    });
    read.mockImplementation(async () => {
      events.push('storage');
      return { bytes: Buffer.from('logo'), mime: 'image/png' };
    });
    brand.create.mockImplementation(async () => {
      events.push('create');
      return row();
    });
    brand.update.mockResolvedValue(row());
    service = new BrandsService(
      { brand, $transaction: transaction } as unknown as PrismaService,
      { assertCurrentSession: session } as unknown as UsersService,
      { read } as unknown as BrandLogoObjectsService,
    );
  });
  it('validates logo outside the transaction and rechecks session before writing', async () => {
    await service.create(admin, { name: ' Brand ', slug: 'brand', logoKey: 'KEY' });
    expect(events).toEqual(['storage', 'transaction', 'session-lock', 'create']);
    expect(session).toHaveBeenCalledWith(tx, {
      adminId: 'admin',
      sessionId: 'session',
      authVersion: 1,
    });
    expect(brand.create).toHaveBeenCalledWith({
      data: { name: 'Brand', slug: 'brand', logoKey: 'key' },
    });
  });
  it('stale session cannot create or update a brand', async () => {
    session.mockRejectedValue(new AdminSessionRejectedError());
    await expect(service.create(admin, { name: 'Brand', slug: 'brand' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(brand.create).not.toHaveBeenCalled();
  });
  it('missing logo bytes prevent a write', async () => {
    read.mockRejectedValue(new BadRequestException());
    await expect(service.update(admin, 'brand', { logoKey: 'KEY' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(transaction).not.toHaveBeenCalled();
  });
  it('clears nullable fields without deleting or reading storage', async () => {
    await service.update(admin, 'brand', { logoKey: null, websiteUrl: null, description: null });
    expect(brand.update).toHaveBeenCalledWith({
      where: { id: 'brand' },
      data: { logoKey: null, websiteUrl: null, description: null },
    });
    expect(read).not.toHaveBeenCalled();
  });
  it.each(['http://example.test', 'https://user:pass@example.test', 'javascript:alert(1)'])(
    'rejects unsafe website %s',
    async (websiteUrl) => {
      await expect(
        service.create(admin, { name: 'Brand', slug: 'brand', websiteUrl }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(transaction).not.toHaveBeenCalled();
    },
  );
  it('normalizes HTTPS website without fetching it', async () => {
    await service.create(admin, {
      name: 'Brand',
      slug: 'brand',
      websiteUrl: 'https://example.test',
    });
    expect(brand.create).toHaveBeenCalledWith({
      data: { name: 'Brand', slug: 'brand', websiteUrl: 'https://example.test/' },
    });
  });
  it('refuses deleting a brand with products', async () => {
    brand.findUnique.mockResolvedValue({ id: 'brand', _count: { products: 1 } });
    await expect(service.remove(admin, 'brand')).rejects.toBeInstanceOf(ConflictException);
    expect(brand.delete).not.toHaveBeenCalled();
  });
  it('deletes an unreferenced brand and returns 404 for a missing one', async () => {
    brand.findUnique.mockResolvedValue({ id: 'brand', _count: { products: 0 } });
    await service.remove(admin, 'brand');
    expect(brand.delete).toHaveBeenCalledWith({ where: { id: 'brand' } });
    brand.findUnique.mockResolvedValue(null);
    await expect(service.remove(admin, 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('translates unique and FK failures instead of claiming success', async () => {
    brand.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await expect(service.update(admin, 'brand', { slug: 'duplicate' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    brand.findUnique.mockResolvedValue({ id: 'brand', _count: { products: 0 } });
    brand.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('referenced', {
        code: 'P2003',
        clientVersion: 'test',
      }),
    );
    await expect(service.remove(admin, 'brand')).rejects.toBeInstanceOf(ConflictException);
  });
  it('public queries filter activity and public logo access does not reveal hidden brands', async () => {
    brand.findMany.mockResolvedValue([]);
    brand.findFirst.mockResolvedValue(null);
    await service.list({ page: 1, limit: 20 }, false);
    expect(brand.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true }, take: 21 }),
    );
    await expect(service.logo('hidden', false)).rejects.toBeInstanceOf(NotFoundException);
    expect(brand.findFirst).toHaveBeenCalledWith({
      where: { slug: 'hidden', isActive: true },
      select: { logoKey: true },
    });
    expect(read).not.toHaveBeenCalled();
  });
  it('maps an optional logo to a public route without storage keys or admin fields', () => {
    expect(brandResponse(row(), false).logoUrl).toBeNull();
    const result = brandResponse({ ...row(), logoKey: 'private-key' }, false);
    expect(result.logoUrl).toBe('/brands/by-slug/brand/logo');
    expect(result).not.toHaveProperty('logoKey');
    expect(result).not.toHaveProperty('isActive');
  });
});
