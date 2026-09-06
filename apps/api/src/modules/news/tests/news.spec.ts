import 'reflect-metadata';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { NewsStatus, Prisma } from '../../../generated/prisma/client';
import { NewsService } from '../news.service';
import { NewsCoverObjectsService } from '../cover-objects.service';
import { newsResponse } from '../news.response';
import { NewsQueryDto } from '../news.dto';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import { AdminSessionRejectedError } from '../../users/types/admin-state.types';
import type { AuthenticatedAdmin } from '../../security/types/security.types';

const id = '11111111-1111-4111-8111-111111111111';
const date = new Date('2026-09-03T00:00:00Z');
const row = {
  id,
  title: 'Title',
  slug: 'article',
  content: '# Heading\n<script>alert(1)</script>',
  excerpt: 'Summary',
  coverKey: null,
  status: NewsStatus.DRAFT,
  publishedAt: null,
  authorId: id,
  createdAt: date,
  updatedAt: date,
};
const admin = { id, sessionId: id, authVersion: 1 } as AuthenticatedAdmin;

function setup() {
  const calls: string[] = [];
  const news = {
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
  const tx = { news };
  const prisma = {
    news,
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
  const covers = {
    read: jest.fn(async () => {
      calls.push('storage');
      return { bytes: Buffer.alloc(0), mime: 'image/png' };
    }),
  };
  const service = new NewsService(
    prisma as unknown as PrismaService,
    users as unknown as UsersService,
    covers as unknown as NewsCoverObjectsService,
  );
  return { service, prisma, news, users, covers, calls, tx };
}

describe('News persistence, publication and projections', () => {
  it('creates only a draft with session author after cover preparation and session lock', async () => {
    const s = setup();
    const result = await s.service.create(admin, {
      title: ' Title ',
      slug: 'article',
      content: '# Heading',
      coverKey: id,
    });
    expect(s.calls).toEqual(['storage', 'transaction', 'session', 'write']);
    expect(s.users.assertCurrentSession).toHaveBeenCalledWith(s.tx, {
      adminId: id,
      sessionId: id,
      authVersion: 1,
    });
    expect(result).toMatchObject({ status: 'DRAFT', publishedAt: null, authorId: id });
  });
  it('filters public list by due publication and avoids loading content or User records', async () => {
    const s = setup();
    s.news.findMany.mockResolvedValue([row, row]);
    const result = await s.service.list(
      { ...new NewsQueryDto(), page: 2, limit: 1, q: ' %_ ' },
      false,
    );
    expect(s.news.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'PUBLISHED',
          publishedAt: { lte: expect.any(Date) },
          title: { contains: '\\%\\_', mode: 'insensitive' },
        },
        skip: 1,
        take: 2,
        select: expect.not.objectContaining({ content: true, author: true }),
      }),
    );
    expect(result.hasMore).toBe(true);
  });
  it('applies identical public visibility to detail and cover and does not read hidden media', async () => {
    const s = setup();
    s.news.findFirst.mockResolvedValue(null);
    await expect(s.service.detail('article', false)).rejects.toBeInstanceOf(NotFoundException);
    await expect(s.service.cover('article', false)).rejects.toBeInstanceOf(NotFoundException);
    for (const [arg] of s.news.findFirst.mock.calls)
      expect(arg.where).toEqual({
        slug: 'article',
        status: 'PUBLISHED',
        publishedAt: { lte: expect.any(Date) },
      });
    expect(s.covers.read).not.toHaveBeenCalled();
  });
  it('allows admin status filters without public visibility restrictions', async () => {
    const s = setup();
    await s.service.list({ ...new NewsQueryDto(), status: NewsStatus.ARCHIVED }, true);
    expect(s.news.findMany.mock.calls[0][0].where).toEqual({ status: 'ARCHIVED' });
  });
  it('publishes now and schedules explicit future times', async () => {
    const s = setup();
    const immediate = await s.service.publication(admin, id, { status: NewsStatus.PUBLISHED });
    expect(immediate.publishedAt).toBeInstanceOf(Date);
    const scheduled = await s.service.publication(admin, id, {
      status: NewsStatus.PUBLISHED,
      publishedAt: '2030-01-01T07:00:00+07:00',
    });
    expect(scheduled.publishedAt?.toISOString()).toBe('2030-01-01T00:00:00.000Z');
  });
  it('preserves an existing publication schedule on repeated publish', async () => {
    const s = setup();
    s.news.findUnique.mockResolvedValue({
      ...row,
      status: NewsStatus.PUBLISHED,
      publishedAt: date,
    });
    expect(
      (await s.service.publication(admin, id, { status: NewsStatus.PUBLISHED })).publishedAt,
    ).toEqual(date);
  });
  it('clears the timestamp for draft and retains it for archive', async () => {
    const s = setup();
    s.news.findUnique.mockResolvedValue({
      ...row,
      status: NewsStatus.PUBLISHED,
      publishedAt: date,
    });
    expect(
      (await s.service.publication(admin, id, { status: NewsStatus.DRAFT })).publishedAt,
    ).toBeNull();
    expect(
      (await s.service.publication(admin, id, { status: NewsStatus.ARCHIVED })).publishedAt,
    ).toEqual(date);
  });
  it('rejects contradictory dates before opening a transaction', () => {
    const s = setup();
    expect(() =>
      s.service.publication(admin, id, {
        status: NewsStatus.DRAFT,
        publishedAt: date.toISOString(),
      }),
    ).toThrow(BadRequestException);
    expect(s.prisma.$transaction).not.toHaveBeenCalled();
  });
  it('preserves Markdown source, omits private metadata and derives SEO without extra fields', () => {
    const publicRow = newsResponse(row, false);
    expect(publicRow.content).toBe(row.content);
    expect(publicRow).not.toHaveProperty('authorId');
    expect(publicRow).not.toHaveProperty('coverKey');
    expect(publicRow.seo).toEqual({
      title: 'Title',
      description: 'Summary',
      canonicalPath: '/news/article',
      imageUrl: null,
      type: 'article',
      noIndex: false,
    });
    expect(newsResponse(row, true).seo.noIndex).toBe(true);
  });
  it('replaces nullable content metadata without rewriting publication state or author', async () => {
    const s = setup();
    await s.service.update(admin, id, { excerpt: null, coverKey: null });
    expect(s.news.update).toHaveBeenCalledWith({
      where: { id },
      data: { excerpt: null, coverKey: null },
    });
  });
  it('rejects all stale-session mutations before persistence', async () => {
    const s = setup();
    s.users.assertCurrentSession.mockRejectedValue(new AdminSessionRejectedError());
    await expect(s.service.update(admin, id, { title: 'Updated' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      s.service.publication(admin, id, { status: NewsStatus.ARCHIVED }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(s.service.remove(admin, id)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(s.news.update).not.toHaveBeenCalled();
    expect(s.news.delete).not.toHaveBeenCalled();
  });
  it('maps missing news and duplicate slugs', async () => {
    const s = setup();
    s.news.findUnique.mockResolvedValue(null);
    await expect(
      s.service.publication(admin, id, { status: NewsStatus.PUBLISHED }),
    ).rejects.toBeInstanceOf(NotFoundException);
    s.news.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await expect(s.service.update(admin, id, { slug: 'existing' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
  it('rejects missing and executable cover references', async () => {
    const storage = {
      put: jest.fn(),
      delete: jest.fn(),
      read: jest.fn().mockResolvedValue(Buffer.from('<svg onload="alert(1)"/>')),
    };
    const covers = new NewsCoverObjectsService(storage);
    await expect(covers.read(id)).rejects.toBeInstanceOf(BadRequestException);
    storage.read.mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' }));
    await expect(covers.read(id)).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.delete).not.toHaveBeenCalled();
  });
});
