import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { NewsStatus, Prisma } from '../../generated/prisma/client';
import { literalSearch } from '../../common/dto/query.transforms';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuthenticatedAdmin } from '../security/types/security.types';
import { UsersService } from '../users/users.service';
import { AdminSessionRejectedError } from '../users/types/admin-state.types';
import type {
  AdminNewsQueryDto,
  CreateNewsDto,
  NewsPublicationDto,
  NewsQueryDto,
  UpdateNewsDto,
} from './news.dto';
import { NEWS_LIST_SELECT, newsResponse } from './news.response';
import { NewsCoverObjectsService } from './cover-objects.service';

@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly covers: NewsCoverObjectsService,
  ) {}

  private publicWhere(): Prisma.NewsWhereInput {
    return { status: NewsStatus.PUBLISHED, publishedAt: { lte: new Date() } };
  }
  async list(query: NewsQueryDto | AdminNewsQueryDto, admin: boolean) {
    const search = literalSearch(query.q);
    const where: Prisma.NewsWhereInput = {
      ...(!admin
        ? this.publicWhere()
        : 'status' in query && query.status !== undefined
          ? { status: query.status }
          : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };
    const rows = await this.prisma.news.findMany({
      where,
      select: NEWS_LIST_SELECT,
      orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit + 1,
    });
    return {
      items: rows.slice(0, query.limit).map((row) => newsResponse(row, admin)),
      page: query.page,
      limit: query.limit,
      hasMore: rows.length > query.limit,
    };
  }
  async detail(identifier: string, admin: boolean) {
    const row = await this.prisma.news.findFirst({
      where: admin ? { id: identifier } : { slug: identifier, ...this.publicWhere() },
    });
    if (!row) throw new NotFoundException('News not found.');
    return newsResponse(row, admin);
  }
  async cover(identifier: string, admin: boolean) {
    const row = await this.prisma.news.findFirst({
      where: admin ? { id: identifier } : { slug: identifier, ...this.publicWhere() },
      select: { coverKey: true },
    });
    if (!row?.coverKey) throw new NotFoundException('Cover not found.');
    try {
      return await this.covers.read(row.coverKey);
    } catch (error) {
      if (error instanceof BadRequestException) throw new NotFoundException('Cover unavailable.');
      throw error;
    }
  }
  async create(admin: AuthenticatedAdmin, input: CreateNewsDto) {
    const data = await this.prepare(input);
    return this.mutate(admin, async (tx) =>
      newsResponse(
        await tx.news.create({
          data: {
            ...data,
            title: input.title.trim(),
            slug: input.slug,
            content: input.content,
            authorId: admin.id,
            status: NewsStatus.DRAFT,
            publishedAt: null,
          },
        }),
        true,
      ),
    );
  }
  async update(admin: AuthenticatedAdmin, id: string, input: UpdateNewsDto) {
    const data = await this.prepare(input);
    return this.mutate(admin, async (tx) =>
      newsResponse(await tx.news.update({ where: { id }, data }), true),
    );
  }
  publication(admin: AuthenticatedAdmin, id: string, input: NewsPublicationDto) {
    if (input.status !== NewsStatus.PUBLISHED && input.publishedAt !== undefined)
      throw new BadRequestException('publishedAt is accepted only for PUBLISHED status.');
    const requestedDate = input.publishedAt === undefined ? undefined : new Date(input.publishedAt);
    if (requestedDate && !Number.isFinite(requestedDate.getTime()))
      throw new BadRequestException('Invalid publication time.');
    return this.mutate(admin, async (tx) => {
      const row = await tx.news.findUnique({
        where: { id },
        select: { status: true, publishedAt: true },
      });
      if (!row) throw new NotFoundException('News not found.');
      const publishedAt =
        input.status === NewsStatus.DRAFT
          ? null
          : input.status === NewsStatus.ARCHIVED
            ? row.publishedAt
            : (requestedDate ??
              (row.status === NewsStatus.PUBLISHED ? (row.publishedAt ?? new Date()) : new Date()));
      return newsResponse(
        await tx.news.update({ where: { id }, data: { status: input.status, publishedAt } }),
        true,
      );
    });
  }
  remove(admin: AuthenticatedAdmin, id: string) {
    return this.mutate(admin, async (tx) => {
      await tx.news.delete({ where: { id } });
      // Immutable cover bytes may be shared by other media owners.
    });
  }
  private async prepare(input: UpdateNewsDto): Promise<UpdateNewsDto> {
    // Explicit field selection prevents ownership fields from entering persistence.
    const data: UpdateNewsDto = {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.coverKey !== undefined ? { coverKey: input.coverKey?.toLowerCase() ?? null } : {}),
    };
    if (data.coverKey) await this.covers.read(data.coverKey);
    return data;
  }
  private async mutate<T>(
    admin: AuthenticatedAdmin,
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          await this.users.assertCurrentSession(tx, {
            adminId: admin.id,
            sessionId: admin.sessionId,
            authVersion: admin.authVersion,
          });
          return work(tx);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
      );
    } catch (error) {
      if (error instanceof AdminSessionRejectedError)
        throw new UnauthorizedException({
          code: 'SESSION_REPLACED',
          message: 'Session is no longer current.',
        });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') throw new ConflictException('News slug already exists.');
        if (error.code === 'P2025') throw new NotFoundException('News not found.');
        if (error.code === 'P2003')
          throw new ConflictException('News author reference is invalid.');
      }
      throw error;
    }
  }
}
