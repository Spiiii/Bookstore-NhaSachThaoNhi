import 'reflect-metadata';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import type { AuthenticatedAdmin } from '../../security/types/security.types';
import { AdminSessionRejectedError } from '../../users/types/admin-state.types';
import { BannersService } from '../banners.service';
import { BannerPolicy } from '../banner.policy';
import { BannerImageObjectsService } from '../image-objects.service';
import { BannerQueryDto } from '../banners.dto';
import { bannerResponse } from '../banners.response';

const id = '11111111-1111-4111-8111-111111111111';
const date = new Date('2030-01-01T00:00:00Z');
const row = {
  id,
  title: 'Internal',
  imageKey: id,
  altText: '',
  placement: 'home-hero',
  targetUrl: null,
  sortOrder: 0,
  isActive: false,
  startsAt: null,
  endsAt: null,
  createdAt: date,
  updatedAt: date,
};
const admin = { id, sessionId: id, authVersion: 1 } as AuthenticatedAdmin;
const input = { title: ' Hero ', imageKey: id, altText: '', placement: 'home-hero' };
function setup() {
  const calls: string[] = [];
  const banner = {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(row),
    findUnique: jest.fn().mockResolvedValue(row),
    create: jest.fn().mockImplementation(async ({ data }) => {
      calls.push('write');
      return { ...row, ...data };
    }),
    update: jest.fn().mockImplementation(async ({ data }) => {
      calls.push('write');
      return { ...row, ...data };
    }),
    delete: jest.fn().mockResolvedValue(row),
  };
  const tx = { banner };
  const prisma = {
    banner,
    $transaction: jest.fn(async (fn: (value: unknown) => Promise<unknown>) => {
      calls.push('transaction');
      return fn(tx);
    }),
  };
  const users = {
    assertCurrentSession: jest.fn(async () => {
      calls.push('session');
    }),
  };
  const images = {
    read: jest.fn(async () => {
      calls.push('storage');
      return { bytes: Buffer.alloc(0), mime: 'image/png' };
    }),
  };
  const policy = new BannerPolicy(new ConfigService());
  const service = new BannersService(
    prisma as unknown as PrismaService,
    users as unknown as UsersService,
    images as unknown as BannerImageObjectsService,
    policy,
  );
  return { service, prisma, banner, users, images, policy, calls };
}
describe('Banner scheduling and persistence', () => {
  it('creates with an existing image before session-checked persistence and maps schedule names', async () => {
    const s = setup();
    const result = await s.service.create(admin, {
      ...input,
      startAt: date.toISOString(),
      endAt: '2030-02-01T00:00:00Z',
    });
    expect(s.calls).toEqual(['storage', 'transaction', 'session', 'write']);
    expect(s.banner.create.mock.calls[0][0].data).toMatchObject({
      title: 'Hero',
      startsAt: date,
      endsAt: new Date('2030-02-01T00:00:00Z'),
    });
    expect(s.banner.create.mock.calls[0][0].data).not.toHaveProperty('startAt');
    expect(result).toMatchObject({ isActive: false, startAt: date });
  });
  it('uses a single query time with inclusive start and exclusive end', async () => {
    const s = setup();
    await s.service.list(new BannerQueryDto(), false);
    const query = s.banner.findMany.mock.calls[0][0];
    expect(query.where).toEqual({
      isActive: true,
      placement: { in: ['home-hero'] },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: expect.any(Date) } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: expect.any(Date) } }] },
      ],
    });
    expect(query.where.AND[0].OR[1].startsAt.lte).toBe(query.where.AND[1].OR[1].endsAt.gt);
    expect(query).toMatchObject({
      skip: 0,
      take: 21,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  });
  it('retains schedule checks on detail and image reads', async () => {
    const s = setup();
    s.banner.findFirst.mockResolvedValue(null);
    await expect(s.service.detail(id, false)).rejects.toBeInstanceOf(NotFoundException);
    await expect(s.service.image(id, false)).rejects.toBeInstanceOf(NotFoundException);
    for (const [query] of s.banner.findFirst.mock.calls)
      expect(query.where).toMatchObject({ id, isActive: true, AND: expect.any(Array) });
    expect(s.images.read).not.toHaveBeenCalled();
  });
  it('allows admin previews without activity or schedule predicates', async () => {
    const s = setup();
    await s.service.image(id, true);
    expect(s.banner.findFirst).toHaveBeenCalledWith({ where: { id }, select: { imageKey: true } });
    expect(s.images.read).toHaveBeenCalledWith(id);
  });
  it('checks a partial schedule update against the stored other endpoint', async () => {
    const s = setup();
    s.banner.findUnique.mockResolvedValue({ ...row, endsAt: date });
    await expect(
      s.service.update(admin, id, { startAt: date.toISOString() }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(s.calls).toEqual(['transaction', 'session']);
    expect(s.banner.update).not.toHaveBeenCalled();
    s.banner.findUnique.mockResolvedValue({ ...row, startsAt: date });
    await expect(
      s.service.update(admin, id, { endAt: '2029-01-01T00:00:00Z' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('permits clearing either bound and preserves omitted bounds', async () => {
    const s = setup();
    s.banner.findUnique.mockResolvedValue({
      ...row,
      startsAt: date,
      endsAt: new Date('2031-01-01T00:00:00Z'),
    });
    await s.service.update(admin, id, { endAt: null });
    expect(s.banner.update).toHaveBeenCalledWith({ where: { id }, data: { endsAt: null } });
  });
  it('rejects equal and reversed create windows before a transaction', async () => {
    const s = setup();
    for (const endAt of [date.toISOString(), '2029-01-01T00:00:00Z'])
      await expect(
        s.service.create(admin, { ...input, startAt: date.toISOString(), endAt }),
      ).rejects.toBeInstanceOf(BadRequestException);
    expect(s.prisma.$transaction).not.toHaveBeenCalled();
  });
  it('supports admin search, placement, inactive filtering and hasMore', async () => {
    const s = setup();
    s.banner.findMany.mockResolvedValue([row, row]);
    const result = await s.service.list(
      {
        ...new BannerQueryDto(),
        page: 2,
        limit: 1,
        placement: 'home-hero',
        isActive: false,
        q: ' %_ ',
      },
      true,
    );
    expect(s.banner.findMany.mock.calls[0][0]).toMatchObject({
      where: {
        placement: 'home-hero',
        isActive: false,
        title: { contains: '\\%\\_', mode: 'insensitive' },
      },
      skip: 1,
      take: 2,
    });
    expect(result.hasMore).toBe(true);
    expect(result.items).toHaveLength(1);
  });
  it('does not expose internal labels, storage keys or schedules publicly', () => {
    const result = bannerResponse(row, false);
    for (const key of ['title', 'imageKey', 'isActive', 'startAt', 'endAt', 'startsAt', 'endsAt'])
      expect(result).not.toHaveProperty(key);
    expect(result.imageUrl).toBe('/banners/' + id + '/image');
    expect(result.targetUrl).toBeNull();
  });
  it('rejects replaced sessions before all mutations', async () => {
    const s = setup();
    s.users.assertCurrentSession.mockRejectedValue(new AdminSessionRejectedError());
    await expect(s.service.create(admin, input)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(s.service.update(admin, id, { isActive: true })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(s.service.remove(admin, id)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(s.banner.create).not.toHaveBeenCalled();
    expect(s.banner.update).not.toHaveBeenCalled();
    expect(s.banner.delete).not.toHaveBeenCalled();
  });
  it('maps missing update/delete and retains image bytes on deletion', async () => {
    const s = setup();
    await s.service.remove(admin, id);
    expect(s.images.read).not.toHaveBeenCalled();
    s.banner.findUnique.mockResolvedValue(null);
    await expect(s.service.update(admin, id, { isActive: true })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    s.banner.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Missing', { code: 'P2025', clientVersion: 'test' }),
    );
    await expect(s.service.remove(admin, id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
describe('Banner placement, URL and image policy', () => {
  it('loads a validated configured allowlist and rejects unsupported slots', async () => {
    expect(
      new BannerPolicy(new ConfigService({ BANNER_PLACEMENTS: 'home-hero, home-footer' }))
        .placements,
    ).toEqual(['home-hero', 'home-footer']);
    expect(() => new BannerPolicy(new ConfigService({ BANNER_PLACEMENTS: '' }))).toThrow();
    const s = setup();
    await expect(
      s.service.create(admin, { ...input, placement: 'unknown' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      s.service.list({ ...new BannerQueryDto(), placement: 'unknown' }, false),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(s.prisma.$transaction).not.toHaveBeenCalled();
  });
  it.each([
    'javascript:alert(1)',
    '//evil.test',
    '/\\evil.test',
    '/a/..//evil.test',
    '/%2fevil.test',
    'https://user:pass@example.test',
    'http://example.test',
    '/path\n',
  ])('rejects unsafe target %s', (url) => {
    expect(() => setup().policy.target(url)).toThrow(BadRequestException);
  });
  it('accepts internal paths and HTTPS and bounds serialized URL size', () => {
    const policy = setup().policy;
    expect(policy.target('/products/book?ref=banner#details')).toBe(
      '/products/book?ref=banner#details',
    );
    expect(policy.target('https://example.test/path')).toBe('https://example.test/path');
    expect(() => policy.target('https://example.test/' + '\u754c'.repeat(250))).toThrow(
      BadRequestException,
    );
  });
  it('rejects SVG/missing image references before persistence', async () => {
    const storage = {
      put: jest.fn(),
      delete: jest.fn(),
      read: jest.fn().mockResolvedValue(Buffer.from('<svg/>')),
    };
    const images = new BannerImageObjectsService(storage);
    await expect(images.read(id)).rejects.toBeInstanceOf(BadRequestException);
    storage.read.mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' }));
    await expect(images.read(id)).rejects.toBeInstanceOf(BadRequestException);
  });
});
