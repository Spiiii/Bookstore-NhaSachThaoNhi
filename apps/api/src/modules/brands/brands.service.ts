import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuthenticatedAdmin } from '../security/types/security.types';
import { UsersService } from '../users/users.service';
import { AdminSessionRejectedError } from '../users/types/admin-state.types';
import type {
  AdminBrandQueryDto,
  BrandQueryDto,
  CreateBrandDto,
  UpdateBrandDto,
} from './brands.dto';
import { brandResponse } from './brands.response';
import { BrandLogoObjectsService } from './logo-objects.service';
import { literalSearch } from '../../common/dto/query.transforms';

@Injectable()
export class BrandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly logos: BrandLogoObjectsService,
  ) {}
  async list(query: BrandQueryDto | AdminBrandQueryDto, admin: boolean) {
    const search = literalSearch(query.q);
    const where: Prisma.BrandWhereInput = {
      ...(!admin
        ? { isActive: true }
        : 'isActive' in query && query.isActive !== undefined
          ? { isActive: query.isActive }
          : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };
    const rows = await this.prisma.brand.findMany({
      where,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit + 1,
    });
    return {
      items: rows.slice(0, query.limit).map((row) => brandResponse(row, admin)),
      page: query.page,
      limit: query.limit,
      hasMore: rows.length > query.limit,
    };
  }
  async detail(identifier: string, admin: boolean) {
    const row = await this.prisma.brand.findFirst({
      where: admin ? { id: identifier } : { slug: identifier, isActive: true },
    });
    if (!row) throw new NotFoundException('Brand not found.');
    return brandResponse(row, admin);
  }
  async logo(identifier: string, admin: boolean) {
    const row = await this.prisma.brand.findFirst({
      where: admin ? { id: identifier } : { slug: identifier, isActive: true },
      select: { logoKey: true },
    });
    if (!row?.logoKey) throw new NotFoundException('Logo not found.');
    try {
      return await this.logos.read(row.logoKey);
    } catch (error) {
      if (error instanceof BadRequestException) throw new NotFoundException('Logo unavailable.');
      throw error;
    }
  }
  async create(admin: AuthenticatedAdmin, input: CreateBrandDto) {
    const data = await this.prepare(input);
    return this.mutate(admin, async (tx) =>
      brandResponse(
        await tx.brand.create({ data: { ...data, name: input.name.trim(), slug: input.slug } }),
        true,
      ),
    );
  }
  async update(admin: AuthenticatedAdmin, id: string, input: UpdateBrandDto) {
    const data = await this.prepare(input);
    return this.mutate(admin, async (tx) =>
      brandResponse(await tx.brand.update({ where: { id }, data }), true),
    );
  }
  remove(admin: AuthenticatedAdmin, id: string) {
    return this.mutate(admin, async (tx) => {
      const row = await tx.brand.findUnique({
        where: { id },
        select: { id: true, _count: { select: { products: true } } },
      });
      if (!row) throw new NotFoundException('Brand not found.');
      if (row._count.products)
        throw new ConflictException('Unassign products before deleting this brand.');
      await tx.brand.delete({ where: { id } });
      // Retain immutable logo bytes: other media owners may still reference them.
    });
  }
  private async prepare(input: UpdateBrandDto): Promise<UpdateBrandDto> {
    const data = { ...input };
    if (data.name !== undefined) data.name = data.name.trim();
    if (data.websiteUrl !== undefined && data.websiteUrl !== null) {
      try {
        const url = new URL(data.websiteUrl);
        if (
          data.websiteUrl !== data.websiteUrl.trim() ||
          /\p{Cc}/u.test(data.websiteUrl) ||
          url.protocol !== 'https:' ||
          !url.hostname ||
          url.username ||
          url.password
        )
          throw new Error();
        data.websiteUrl = url.toString();
        if (data.websiteUrl.length > 2048) throw new Error('Normalized URL is too long.');
      } catch {
        throw new BadRequestException('Brand website must be an HTTPS URL without credentials.');
      }
    }
    if (data.logoKey) {
      data.logoKey = data.logoKey.toLowerCase();
      await this.logos.read(data.logoKey);
    }
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
        if (error.code === 'P2002') throw new ConflictException('Brand slug already exists.');
        if (error.code === 'P2003')
          throw new ConflictException('Brand is still referenced by products.');
        if (error.code === 'P2025') throw new NotFoundException('Brand not found.');
      }
      throw error;
    }
  }
}
