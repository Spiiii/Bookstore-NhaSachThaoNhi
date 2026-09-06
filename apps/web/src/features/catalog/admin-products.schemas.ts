import { z } from 'zod';

const nullableText = z.string().nullable();
const imageSchema = z.object({
  id: z.uuid(), altText: nullableText, sortOrder: z.number().int(), isPrimary: z.boolean(),
  url: z.string(), storageKey: z.string().optional(),
});
const attributeSchema = z.object({
  id: z.uuid(), key: z.string(), label: z.string(), value: z.string(), sortOrder: z.number().int(),
});
const marketplaceButtonSchema = z.object({
  marketplace: z.enum(['SHOPEE', 'TIKTOK_SHOP']), url: z.url().nullable(),
  available: z.boolean(), message: nullableText,
});
const marketplaceLinkSchema = z.object({
  id: z.uuid(), productId: z.uuid(), marketplace: z.enum(['SHOPEE', 'TIKTOK_SHOP']),
  url: z.url(), isActive: z.boolean(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
});

export const adminProductSchema = z.object({
  id: z.uuid(), sku: z.string(), name: z.string(), slug: z.string(), summary: nullableText,
  description: nullableText.optional(), categoryId: z.uuid().nullable(), brandId: z.uuid().nullable(),
  referencePrice: z.string().nullable(), currency: z.literal('VND'), images: z.array(imageSchema),
  attributes: z.array(attributeSchema).optional(), marketplaces: z.array(marketplaceButtonSchema),
  marketplaceLinks: z.array(marketplaceLinkSchema).optional(), isActive: z.boolean(),
  createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
});
export const adminProductPageSchema = z.object({
  items: z.array(adminProductSchema), page: z.number().int(), limit: z.number().int(), hasMore: z.boolean(),
});

export const productFormSchema = z.object({
  sku: z.string().trim().min(1, 'Mã sản phẩm là bắt buộc.').max(64),
  name: z.string().trim().min(1, 'Tên sản phẩm là bắt buộc.').max(200),
  slug: z.string().trim().max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.'),
  summary: z.string().max(500),
  description: z.string().max(100_000),
  categoryId: z.union([z.literal(''), z.uuid('Danh mục không hợp lệ.')]),
  brandId: z.union([z.literal(''), z.uuid('Thương hiệu không hợp lệ.')]),
  referencePrice: z.union([z.literal(''), z.string().regex(/^(0|[1-9][0-9]{0,13})$/, 'Giá phải là số nguyên VND, tối đa 14 chữ số.')]),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
