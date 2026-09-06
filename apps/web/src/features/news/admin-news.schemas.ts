import { z } from 'zod';

export const newsStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
const newsSeoSchema = z.object({ title: z.string(), description: z.string().nullable(), canonicalPath: z.string(), imageUrl: z.string().nullable(), type: z.literal('article'), noIndex: z.boolean() });

export const adminNewsSchema = z.object({
  id: z.uuid(), title: z.string(), slug: z.string(), excerpt: z.string().nullable(), content: z.string().optional(),
  coverUrl: z.string().nullable(), coverKey: z.uuid().nullable().optional(), publishedAt: z.iso.datetime().nullable(),
  status: newsStatusSchema, authorId: z.uuid(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(), seo: newsSeoSchema,
});

export const adminNewsPageSchema = z.object({ items: z.array(adminNewsSchema), page: z.number().int().positive(), limit: z.number().int().positive(), hasMore: z.boolean() });

export const newsFormSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề là bắt buộc.').max(200),
  slug: z.string().trim().max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.'),
  excerpt: z.string().max(500),
  content: z.string().trim().min(1, 'Nội dung là bắt buộc.').max(100_000),
  status: newsStatusSchema,
  publishedAt: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Thời gian xuất bản không hợp lệ.')]),
});

export type NewsFormValues = z.infer<typeof newsFormSchema>;
