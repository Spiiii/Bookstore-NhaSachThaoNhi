import 'server-only';

import { notFound } from 'next/navigation';
import { cache } from 'react';
import { z } from 'zod';
import { getPublicApi } from '@/lib/http/public-api.server';

const imageSchema = z.object({
  id: z.uuid(), altText: z.string().nullable(), sortOrder: z.number().int(), isPrimary: z.boolean(), url: z.string().regex(/^\/(?!\/)/),
});
const marketplaceSchema = z.object({
  marketplace: z.enum(['SHOPEE', 'TIKTOK_SHOP']),
  url: z.url().nullable(),
  available: z.boolean(),
  message: z.string().nullable(),
});
const attributeSchema = z.object({
  id: z.uuid(), key: z.string(), label: z.string(), value: z.string(), sortOrder: z.number().int(),
});
export const publicProductSchema = z.object({
  id: z.uuid(),
  sku: z.string(),
  name: z.string(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().nullable(),
  categoryId: z.uuid().nullable(),
  brandId: z.uuid().nullable(),
  referencePrice: z.string().regex(/^(0|[1-9][0-9]{0,13})$/).nullable(),
  currency: z.literal('VND'),
  description: z.string().nullable().optional(),
  images: z.array(imageSchema),
  attributes: z.array(attributeSchema).optional(),
  marketplaces: z.array(marketplaceSchema),
}).refine((product) => product.images.length > 0, 'A public product must have an image.')
  .refine((product) => new Set(product.marketplaces.map((item) => item.marketplace)).size === product.marketplaces.length, 'Marketplace entries must be unique.');
const pageSchema = z.object({
  items: z.array(publicProductSchema), page: z.number().int(), limit: z.number().int(), hasMore: z.boolean(),
});

export type PublicProduct = z.infer<typeof publicProductSchema>;
export type ProductFilters = { page?: number; limit?: number; q?: string; categoryId?: string; brandId?: string };

export async function listPublicProducts(filters: ProductFilters = {}) {
  const query = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 20),
  });
  if (filters.q) query.set('q', filters.q);
  if (filters.categoryId) query.set('categoryId', filters.categoryId);
  if (filters.brandId) query.set('brandId', filters.brandId);
  return getPublicApi(`/products?${query}`, pageSchema);
}

export const getPublicProduct = cache((slug: string) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();
  return getPublicApi(`/products/${encodeURIComponent(slug)}`, publicProductSchema);
});
