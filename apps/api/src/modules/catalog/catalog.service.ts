import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Marketplace, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuthenticatedAdmin } from '../security/types/security.types';
import { AdminSessionRejectedError } from '../users/types/admin-state.types';
import { UsersService } from '../users/users.service';
import type {
  AdminProductQueryDto,
  AttachImageDto,
  AttributeDto,
  CreateProductDto,
  ImageMetadataDto,
  MarketplaceLinkDto,
  ProductQueryDto,
  UpdateAttributeDto,
  UpdateProductDto,
} from './catalog.dto';
import { PRODUCT_GRAPH, PRODUCT_LIST_SELECT, productResponse } from './catalog.mapper';
import { literalSearch } from '../../common/dto/query.transforms';
import { ImageObjectsService } from './images/image-objects.service';
import { marketplaceUrl } from './marketplace-links/marketplace.policy';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly imageObjects: ImageObjectsService,
  ) {}

  async list(query: ProductQueryDto | AdminProductQueryDto, admin: boolean) {
    const search = literalSearch(query.q);
    const where: Prisma.ProductWhereInput = {
      ...(!admin
        ? { isActive: true, images: { some: {} } }
        : 'isActive' in query && query.isActive !== undefined
          ? { isActive: query.isActive }
          : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.brandId ? { brandId: query.brandId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const products = await this.prisma.product.findMany({
      where,
      select: PRODUCT_LIST_SELECT,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit + 1,
    });
    return {
      items: products.slice(0, query.limit).map((p) => productResponse(p, admin, false)),
      page: query.page,
      limit: query.limit,
      hasMore: products.length > query.limit,
    };
  }

  async detail(identifier: string, admin: boolean) {
    const product = await this.prisma.product.findFirst({
      where: admin
        ? { id: identifier }
        : { slug: identifier, isActive: true, images: { some: {} } },
      include: PRODUCT_GRAPH,
    });
    if (!product) throw new NotFoundException('Product not found.');
    return productResponse(product, admin);
  }

  async image(identifier: string, imageId: string, admin: boolean) {
    const image = await this.prisma.productImage.findFirst({
      where: {
        id: imageId,
        product: admin ? { id: identifier } : { slug: identifier, isActive: true },
      },
      select: { storageKey: true },
    });
    if (!image) throw new NotFoundException('Image not found.');
    try {
      return await this.imageObjects.read(image.storageKey);
    } catch (error) {
      if (error instanceof BadRequestException) throw new NotFoundException('Image unavailable.');
      throw error;
    }
  }

  create(admin: AuthenticatedAdmin, input: CreateProductDto) {
    return this.mutate(admin, undefined, async (tx) => {
      const product = await tx.product.create({
        data: {
          ...input,
          sku: input.sku.trim().toUpperCase(),
          name: input.name.trim(),
          currency: 'VND',
          isActive: false,
        },
        include: PRODUCT_GRAPH,
      });
      return productResponse(product, true);
    });
  }

  update(admin: AuthenticatedAdmin, id: string, input: UpdateProductDto) {
    return this.mutate(admin, id, async (tx) =>
      productResponse(
        await tx.product.update({
          where: { id },
          data: {
            ...input,
            ...(input.sku !== undefined ? { sku: input.sku.trim().toUpperCase() } : {}),
            ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          },
          include: PRODUCT_GRAPH,
        }),
        true,
      ),
    );
  }

  publish(admin: AuthenticatedAdmin, id: string, isActive: boolean) {
    return this.mutate(admin, id, async (tx) => {
      if (isActive && (await tx.productImage.count({ where: { productId: id } })) === 0) {
        throw new ConflictException('A public product requires an image.');
      }
      return productResponse(
        await tx.product.update({ where: { id }, data: { isActive }, include: PRODUCT_GRAPH }),
        true,
      );
    });
  }

  remove(admin: AuthenticatedAdmin, id: string) {
    return this.mutate(admin, id, async (tx) => {
      await tx.product.delete({ where: { id } });
    });
  }

  async attachImage(admin: AuthenticatedAdmin, id: string, input: AttachImageDto) {
    const storageKey = input.storageKey.toLowerCase();
    await this.imageObjects.read(storageKey); // Filesystem work finishes before taking database locks.
    return this.mutate(admin, id, async (tx) => {
      if (input.isPrimary)
        await tx.productImage.updateMany({
          where: { productId: id, isPrimary: true },
          data: { isPrimary: false },
        });
      await tx.productImage.create({ data: { ...input, storageKey, productId: id } });
      return this.current(tx, id);
    });
  }

  updateImage(admin: AuthenticatedAdmin, id: string, imageId: string, input: ImageMetadataDto) {
    return this.mutate(admin, id, async (tx) => {
      if (
        !(await tx.productImage.findFirst({
          where: { id: imageId, productId: id },
          select: { id: true },
        }))
      )
        throw new NotFoundException('Image not found.');
      if (input.isPrimary)
        await tx.productImage.updateMany({
          where: { productId: id, isPrimary: true },
          data: { isPrimary: false },
        });
      await tx.productImage.update({ where: { id: imageId }, data: input });
      return this.current(tx, id);
    });
  }

  removeImage(admin: AuthenticatedAdmin, id: string, imageId: string) {
    return this.mutate(admin, id, async (tx) => {
      const image = await tx.productImage.findFirst({
        where: { id: imageId, productId: id },
        select: { id: true },
      });
      if (!image) throw new NotFoundException('Image not found.');
      const product = await tx.product.findUniqueOrThrow({
        where: { id },
        select: { isActive: true },
      });
      if (product.isActive && (await tx.productImage.count({ where: { productId: id } })) <= 1)
        throw new ConflictException('Hide the product before removing its last image.');
      await tx.productImage.delete({ where: { id: imageId } });
      // Do not delete shared bytes. Storage cleanup must prove no references across all media owners.
    });
  }

  addAttribute(admin: AuthenticatedAdmin, id: string, input: AttributeDto) {
    return this.mutate(admin, id, async (tx) => {
      await tx.productAttribute.create({ data: { ...input, productId: id } });
      return this.current(tx, id);
    });
  }

  updateAttribute(
    admin: AuthenticatedAdmin,
    id: string,
    attributeId: string,
    input: UpdateAttributeDto,
  ) {
    return this.mutate(admin, id, async (tx) => {
      const result = await tx.productAttribute.updateMany({
        where: { id: attributeId, productId: id },
        data: input,
      });
      if (!result.count) throw new NotFoundException('Attribute not found.');
      return this.current(tx, id);
    });
  }

  removeAttribute(admin: AuthenticatedAdmin, id: string, attributeId: string) {
    return this.mutate(admin, id, async (tx) => {
      const result = await tx.productAttribute.deleteMany({
        where: { id: attributeId, productId: id },
      });
      if (!result.count) throw new NotFoundException('Attribute not found.');
    });
  }

  setMarketplace(
    admin: AuthenticatedAdmin,
    id: string,
    marketplace: Marketplace,
    input: MarketplaceLinkDto,
  ) {
    const url = marketplaceUrl(marketplace, input.url);
    return this.mutate(admin, id, async (tx) => {
      await tx.productMarketplaceLink.upsert({
        where: { productId_marketplace: { productId: id, marketplace } },
        create: { ...input, url, productId: id, marketplace },
        update: { ...input, url },
      });
      return this.current(tx, id);
    });
  }

  removeMarketplace(admin: AuthenticatedAdmin, id: string, marketplace: Marketplace) {
    return this.mutate(admin, id, async (tx) => {
      await tx.productMarketplaceLink.deleteMany({ where: { productId: id, marketplace } });
    });
  }

  private async current(tx: Prisma.TransactionClient, id: string) {
    return productResponse(
      await tx.product.findUniqueOrThrow({ where: { id }, include: PRODUCT_GRAPH }),
      true,
    );
  }

  private async mutate<T>(
    admin: AuthenticatedAdmin,
    productId: string | undefined,
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
          if (productId) {
            const rows = await tx.$queryRaw<
              Array<{ id: string }>
            >`SELECT id FROM public.products WHERE id = ${productId}::uuid FOR UPDATE`;
            if (!rows.length) throw new NotFoundException('Product not found.');
          }
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
        if (error.code === 'P2002')
          throw new ConflictException('Product identifier or child key already exists.');
        if (error.code === 'P2003')
          throw new BadRequestException(
            'Referenced category or brand is invalid, or the record is still referenced.',
          );
        if (error.code === 'P2025') throw new NotFoundException('Record not found.');
      }
      throw error;
    }
  }
}
