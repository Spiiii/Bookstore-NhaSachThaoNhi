import { Marketplace, type Prisma } from '../../generated/prisma/client';

export const PRODUCT_GRAPH = {
  images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }] },
  attributes: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
  marketplaceLinks: { orderBy: { marketplace: 'asc' } },
} satisfies Prisma.ProductInclude;
export type ProductGraph = Prisma.ProductGetPayload<{ include: typeof PRODUCT_GRAPH }>;

export const PRODUCT_LIST_SELECT = {
  id: true,
  sku: true,
  name: true,
  slug: true,
  summary: true,
  categoryId: true,
  brandId: true,
  referencePrice: true,
  currency: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  images: PRODUCT_GRAPH.images,
  marketplaceLinks: PRODUCT_GRAPH.marketplaceLinks,
} satisfies Prisma.ProductSelect;
export type ProductListRow = Prisma.ProductGetPayload<{ select: typeof PRODUCT_LIST_SELECT }>;

export function productResponse(
  product: ProductGraph | ProductListRow,
  admin: boolean,
  detail = true,
) {
  const base = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    summary: product.summary,
    categoryId: product.categoryId,
    brandId: product.brandId,
    referencePrice: product.referencePrice?.toFixed(0) ?? null,
    currency: product.currency,
    ...(detail && 'description' in product ? { description: product.description } : {}),
    images: product.images.map(({ id, storageKey, altText, sortOrder, isPrimary }) => ({
      id,
      altText,
      sortOrder,
      isPrimary,
      ...(admin ? { storageKey } : {}),
      url: admin
        ? '/admin/products/' + product.id + '/images/' + id + '/content'
        : '/products/' + product.slug + '/images/' + id,
    })),
    ...(detail && 'attributes' in product
      ? {
          attributes: product.attributes.map(({ id, key, label, value, sortOrder }) => ({
            id,
            key,
            label,
            value,
            sortOrder,
          })),
        }
      : {}),
    marketplaces: [Marketplace.SHOPEE, Marketplace.TIKTOK_SHOP].map((marketplace) => {
      const row = product.marketplaceLinks.find(
        (link) => link.marketplace === marketplace && link.isActive,
      );
      return {
        marketplace,
        url: row?.url ?? null,
        available: Boolean(row),
        message: row ? null : 'Chưa có liên kết',
      };
    }),
  };
  return admin
    ? {
        ...base,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        marketplaceLinks: product.marketplaceLinks,
      }
    : base;
}
