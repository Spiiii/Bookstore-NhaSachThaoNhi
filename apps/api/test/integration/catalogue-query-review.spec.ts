import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  ProductQueryDto,
  CreateProductDto,
  AttributeDto,
} from '../../src/modules/catalog/catalog.dto';
import { CategoryQueryDto, CreateCategoryDto } from '../../src/modules/categories/categories.dto';
import { BrandQueryDto, CreateBrandDto } from '../../src/modules/brands/brands.dto';
import { literalSearch } from '../../src/common/dto/query.transforms';
import { CatalogService } from '../../src/modules/catalog/catalog.service';
import { CategoriesService } from '../../src/modules/categories/categories.service';
import { BrandsService } from '../../src/modules/brands/brands.service';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { UsersService } from '../../src/modules/users/users.service';
import { BrandLogoObjectsService } from '../../src/modules/brands/logo-objects.service';
import { ImageObjectsService } from '../../src/modules/catalog/images/image-objects.service';
import type { AuthenticatedAdmin } from '../../src/modules/security/types/security.types';

describe.each([ProductQueryDto, CategoryQueryDto, BrandQueryDto])('%p query parsing', (Dto) => {
  it.each(['0x10', '1e2', '1.0', '01', '1\n', null, true, ['1', '2']])(
    'rejects noncanonical page %j',
    (page) => {
      expect(validateSync(plainToInstance(Dto, { page })).length).toBeGreaterThan(0);
    },
  );
  it('preserves defaults, parses canonical digits and trims search', () => {
    expect(plainToInstance(Dto, {})).toMatchObject({ page: 1, limit: 20 });
    const dto = plainToInstance(Dto, { page: '2', limit: '50', q: '  books  ' });
    expect(validateSync(dto)).toEqual([]);
    expect(dto).toMatchObject({ page: 2, limit: 50, q: 'books' });
  });
  it('rejects NUL search instead of passing invalid PostgreSQL text', () => {
    expect(validateSync(plainToInstance(Dto, { q: 'book\0' })).length).toBeGreaterThan(0);
  });
});

describe('Canonical write DTOs', () => {
  it.each([CreateProductDto, CreateCategoryDto, CreateBrandDto])(
    'rejects trailing newline slugs and NUL descriptions in %p',
    (Dto) => {
      const input = {
        name: 'Name',
        slug: 'slug\n',
        ...(Dto === CreateProductDto ? { sku: 'SKU' } : {}),
      };
      expect(
        validateSync(plainToInstance(Dto as typeof CreateBrandDto, input)).some(
          (error) => error.property === 'slug',
        ),
      ).toBe(true);
      expect(
        validateSync(
          plainToInstance(Dto as typeof CreateBrandDto, {
            ...input,
            slug: 'slug',
            description: 'bad\0text',
          }),
        ).some((error) => error.property === 'description'),
      ).toBe(true);
    },
  );
  it('validates SKU length after case expansion, and rejects newline price/attribute keys', () => {
    const input = { name: 'Name', slug: 'slug', sku: '\u00df'.repeat(64) };
    expect(
      validateSync(plainToInstance(CreateProductDto, input)).some(
        (error) => error.property === 'sku',
      ),
    ).toBe(true);
    expect(plainToInstance(CreateProductDto, { ...input, sku: ' book-1 ' }).sku).toBe('BOOK-1');
    expect(
      validateSync(
        plainToInstance(CreateProductDto, { ...input, sku: 'SKU', referencePrice: '100\n' }),
      ).some((error) => error.property === 'referencePrice'),
    ).toBe(true);
    expect(
      validateSync(
        plainToInstance(AttributeDto, { key: 'isbn\n', label: 'ISBN', value: '123' }),
      ).some((error) => error.property === 'key'),
    ).toBe(true);
  });
});

describe('Prisma query and normalized storage bounds', () => {
  it('treats wildcard characters literally while retaining public relation filters', async () => {
    const product = { findMany: jest.fn().mockResolvedValue([]) };
    const category = { findMany: jest.fn().mockResolvedValue([]) };
    const brand = { findMany: jest.fn().mockResolvedValue([]) };
    const prisma = { product, category, brand } as unknown as PrismaService;
    const users = {} as UsersService;
    const q = '  100%_\\  ';
    const search = literalSearch(q);
    expect(search).toBe('100\\%\\_\\\\');
    await new CatalogService(prisma, users, {} as ImageObjectsService).list(
      { page: 2, limit: 5, q, categoryId: 'category', brandId: 'brand' },
      false,
    );
    const args = product.findMany.mock.calls[0]![0];
    expect(args).toMatchObject({
      skip: 5,
      take: 6,
      where: {
        categoryId: 'category',
        brandId: 'brand',
        isActive: true,
        images: { some: {} },
        OR: [{ name: { contains: search } }, { sku: { contains: search } }],
      },
    });
    expect(args.select).not.toHaveProperty('description');
    expect(args.select).not.toHaveProperty('attributes');
    expect(args).not.toHaveProperty('include');
    await new CategoriesService(prisma, users).list(
      { page: 1, limit: 20, q, parentId: 'parent' },
      false,
    );
    expect(category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          parentId: 'parent',
          name: { contains: search, mode: 'insensitive' },
        },
      }),
    );
    await new BrandsService(prisma, users, {} as BrandLogoObjectsService).list(
      { page: 1, limit: 20, q, isActive: false },
      true,
    );
    expect(brand.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: false, name: { contains: search, mode: 'insensitive' } },
      }),
    );
  });
  it('omits whitespace-only search and refuses an expanded URL exceeding varchar(2048)', async () => {
    expect(literalSearch('   ')).toBeUndefined();
    const transaction = jest.fn();
    const service = new BrandsService(
      { $transaction: transaction } as unknown as PrismaService,
      {} as UsersService,
      {} as BrandLogoObjectsService,
    );
    await expect(
      service.create({} as AuthenticatedAdmin, {
        name: 'Brand',
        slug: 'brand',
        websiteUrl: 'https://example.test/' + '\u754c'.repeat(250),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction).not.toHaveBeenCalled();
  });
});
