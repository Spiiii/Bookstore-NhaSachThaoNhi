import {
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
  AdminCategoryQueryDto,
  CategoryQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './categories.dto';
import { categoryResponse, categoryTree } from './category-tree';
import { literalSearch } from '../../common/dto/query.transforms';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async list(query: CategoryQueryDto | AdminCategoryQueryDto, admin: boolean) {
    const search = literalSearch(query.q);
    const where: Prisma.CategoryWhereInput = {
      ...(!admin
        ? { isActive: true }
        : 'isActive' in query && query.isActive !== undefined
          ? { isActive: query.isActive }
          : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(query.parentId ? { parentId: query.parentId } : {}),
    };
    const rows = await this.prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit + 1,
    });
    return {
      items: rows.slice(0, query.limit).map((row) => categoryResponse(row, admin)),
      page: query.page,
      limit: query.limit,
      hasMore: rows.length > query.limit,
    };
  }

  async tree(admin: boolean) {
    // A single statement supplies a consistent snapshot, including hidden ancestors needed for promotion.
    return categoryTree(await this.prisma.category.findMany(), admin);
  }

  async detail(identifier: string, admin: boolean) {
    const row = await this.prisma.category.findFirst({
      where: admin ? { id: identifier } : { slug: identifier, isActive: true },
    });
    if (!row) throw new NotFoundException('Category not found.');
    return categoryResponse(row, admin);
  }

  create(admin: AuthenticatedAdmin, input: CreateCategoryDto) {
    return this.mutate(admin, async (tx) => {
      if (input.parentId) await this.assertParent(tx, undefined, input.parentId);
      return categoryResponse(
        await tx.category.create({
          data: {
            ...input,
            name: input.name.trim(),
            parentId: input.parentId?.toLowerCase() ?? null,
          },
        }),
        true,
      );
    });
  }

  update(admin: AuthenticatedAdmin, id: string, input: UpdateCategoryDto) {
    const categoryId = id.toLowerCase();
    return this.mutate(admin, async (tx) => {
      if (!(await tx.category.findUnique({ where: { id: categoryId }, select: { id: true } })))
        throw new NotFoundException('Category not found.');
      if (input.parentId) await this.assertParent(tx, categoryId, input.parentId);
      return categoryResponse(
        await tx.category.update({
          where: { id: categoryId },
          data: {
            ...input,
            ...(input.name !== undefined ? { name: input.name.trim() } : {}),
            ...(input.parentId !== undefined
              ? { parentId: input.parentId?.toLowerCase() ?? null }
              : {}),
          },
        }),
        true,
      );
    });
  }

  remove(admin: AuthenticatedAdmin, id: string) {
    return this.mutate(admin, async (tx) => {
      const row = await tx.category.findUnique({
        where: { id },
        select: { id: true, _count: { select: { children: true, products: true } } },
      });
      if (!row) throw new NotFoundException('Category not found.');
      if (row._count.children || row._count.products)
        throw new ConflictException(
          'Move child categories and unassign products before deleting this category.',
        );
      await tx.category.delete({ where: { id } });
    });
  }

  private async assertParent(
    tx: Prisma.TransactionClient,
    id: string | undefined,
    parentId: string,
  ) {
    let current: string | null = parentId.toLowerCase();
    const visited = new Set<string>();
    while (current !== null) {
      if (current === id || visited.has(current))
        throw new ConflictException(
          'Category parent would create a cycle or belongs to an invalid tree.',
        );
      visited.add(current);
      const parent: { parentId: string | null } | null = await tx.category.findUnique({
        where: { id: current },
        select: { parentId: true },
      });
      if (!parent) throw new NotFoundException('Parent category not found.');
      current = parent.parentId;
    }
  }

  private async mutate<T>(
    admin: AuthenticatedAdmin,
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          // Shared singleton row lock serializes ALL category mutations and session changes.
          // Reuse B3's existing common lock; no separate lock order or tree lock is introduced.
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
        if (error.code === 'P2002') throw new ConflictException('Category slug already exists.');
        if (error.code === 'P2003')
          throw new ConflictException(
            'Category is referenced, or the requested parent no longer exists.',
          );
        if (error.code === 'P2025') throw new NotFoundException('Category not found.');
      }
      throw error;
    }
  }
}
