import { z } from 'zod';

export const adminBrandSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  websiteUrl: z.url().nullable(),
  logoUrl: z.string().nullable(),
  logoKey: z.uuid().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const adminBrandPageSchema = z.object({
  items: z.array(adminBrandSchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});

export const brandFormSchema = z.object({
  name: z.string().trim().min(1, 'Tên thương hiệu là bắt buộc.').max(160),
  slug: z.string().trim().max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.'),
  description: z.string().max(100_000),
  websiteUrl: z.union([z.literal(''), z.url('Website không hợp lệ.').refine((url) => url.startsWith('https://'), 'Website phải dùng HTTPS.')]),
  isActive: z.boolean(),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;
