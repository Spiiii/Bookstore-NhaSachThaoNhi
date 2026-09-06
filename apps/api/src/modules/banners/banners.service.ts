import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { literalSearch } from '../../common/dto/query.transforms';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuthenticatedAdmin } from '../security/types/security.types';
import { UsersService } from '../users/users.service';
import { AdminSessionRejectedError } from '../users/types/admin-state.types';
import type {
  AdminBannerQueryDto,
  BannerQueryDto,
  CreateBannerDto,
  UpdateBannerDto,
} from './banners.dto';
import { bannerResponse } from './banners.response';
import { BannerImageObjectsService } from './image-objects.service';
import { BannerPolicy } from './banner.policy';

@Injectable()
export class BannersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly images: BannerImageObjectsService,
    private readonly policy: BannerPolicy,
  ) {}
  private publicWhere(): Prisma.BannerWhereInput {
    const now = new Date();
    return {
      isActive: true,
      placement: { in: [...this.policy.placements] },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    };
  }
  async list(query: BannerQueryDto | AdminBannerQueryDto, admin: boolean) {
    if (query.placement !== undefined) this.policy.assertPlacement(query.placement);
    const search = admin && 'q' in query ? literalSearch(query.q) : undefined;
    const where: Prisma.BannerWhereInput = {
      ...(!admin
        ? this.publicWhere()
        : 'isActive' in query && query.isActive !== undefined
          ? { isActive: query.isActive }
          : {}),
      ...(query.placement !== undefined ? { placement: query.placement } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };
    const rows = await this.prisma.banner.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit + 1,
    });
    return {
      items: rows.slice(0, query.limit).map((row) => bannerResponse(row, admin)),
      page: query.page,
      limit: query.limit,
      hasMore: rows.length > query.limit,
    };
  }
  async detail(id: string, admin: boolean) {
    const row = await this.prisma.banner.findFirst({
      where: { id, ...(!admin ? this.publicWhere() : {}) },
    });
    if (!row) throw new NotFoundException('Banner not found.');
    return bannerResponse(row, admin);
  }
  async image(id: string, admin: boolean) {
    const row = await this.prisma.banner.findFirst({
      where: { id, ...(!admin ? this.publicWhere() : {}) },
      select: { imageKey: true },
    });
    if (!row) throw new NotFoundException('Banner image not found.');
    try {
      return await this.images.read(row.imageKey);
    } catch (error) {
      if (error instanceof BadRequestException)
        throw new NotFoundException('Banner image unavailable.');
      throw error;
    }
  }
  async create(admin: AuthenticatedAdmin, input: CreateBannerDto) {
    const data = await this.prepare(input);
    this.assertWindow(data.startsAt ?? null, data.endsAt ?? null);
    return this.mutate(admin, async (tx) =>
      bannerResponse(
        await tx.banner.create({
          data: {
            ...data,
            title: input.title.trim(),
            imageKey: input.imageKey.toLowerCase(),
            altText: input.altText,
            placement: input.placement,
          },
        }),
        true,
      ),
    );
  }
  async update(admin: AuthenticatedAdmin, id: string, input: UpdateBannerDto) {
    const data = await this.prepare(input);
    return this.mutate(admin, async (tx) => {
      const row = await tx.banner.findUnique({
        where: { id },
        select: { startsAt: true, endsAt: true },
      });
      if (!row) throw new NotFoundException('Banner not found.');
      this.assertWindow(
        data.startsAt === undefined ? row.startsAt : data.startsAt,
        data.endsAt === undefined ? row.endsAt : data.endsAt,
      );
      return bannerResponse(await tx.banner.update({ where: { id }, data }), true);
    });
  }
  remove(admin: AuthenticatedAdmin, id: string) {
    return this.mutate(admin, async (tx) => {
      await tx.banner.delete({ where: { id } });
    });
  }
  private assertWindow(start: Date | null, end: Date | null) {
    if (start && end && end.getTime() <= start.getTime())
      throw new BadRequestException('endAt must be strictly after startAt.');
  }
  private date(value: string | null): Date | null {
    if (value === null) return null;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()))
      throw new BadRequestException('Invalid schedule timestamp.');
    return date;
  }
  private async prepare(input: UpdateBannerDto) {
    if (input.placement !== undefined) this.policy.assertPlacement(input.placement);
    const data = {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.imageKey !== undefined ? { imageKey: input.imageKey.toLowerCase() } : {}),
      ...(input.altText !== undefined ? { altText: input.altText } : {}),
      ...(input.targetUrl !== undefined
        ? { targetUrl: input.targetUrl === null ? null : this.policy.target(input.targetUrl) }
        : {}),
      ...(input.placement !== undefined ? { placement: input.placement } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.startAt !== undefined ? { startsAt: this.date(input.startAt) } : {}),
      ...(input.endAt !== undefined ? { endsAt: this.date(input.endAt) } : {}),
    };
    if (data.imageKey) await this.images.read(data.imageKey);
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
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
        throw new NotFoundException('Banner not found.');
      throw error;
    }
  }
}
