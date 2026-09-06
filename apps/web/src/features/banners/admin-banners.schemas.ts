import { z } from 'zod';

export const adminBannerSchema = z.object({
  id: z.uuid(), imageUrl: z.string(), imageKey: z.uuid(), altText: z.string(), targetUrl: z.string().nullable(),
  placement: z.string(), sortOrder: z.number().int().nonnegative(), isActive: z.boolean(),
  startAt: z.iso.datetime().nullable(), endAt: z.iso.datetime().nullable(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(), title: z.string(),
});

export const adminBannerPageSchema = z.object({ items: z.array(adminBannerSchema), page: z.number().int().positive(), limit: z.number().int().positive(), hasMore: z.boolean() });

const localDateTime = z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Thời gian không hợp lệ.')]);
const targetUrl = z.string().max(2048).refine((value) => {
  if (!value) return true;
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}, 'Liên kết phải là đường dẫn nội bộ bắt đầu bằng / hoặc URL HTTPS.');

export const bannerFormSchema = z.object({
  title: z.string().trim().min(1, 'Tên nội bộ là bắt buộc.').max(160),
  altText: z.string().max(250),
  targetUrl,
  placement: z.string().trim().max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Placement chỉ gồm chữ thường, số và dấu gạch ngang.'),
  sortOrder: z.string().regex(/^(0|[1-9][0-9]{0,9})$/, 'Thứ tự phải là số nguyên không âm.'),
  isActive: z.boolean(),
  startAt: localDateTime,
  endAt: localDateTime,
}).refine((values) => !values.startAt || !values.endAt || new Date(values.endAt) > new Date(values.startAt), { path: ['endAt'], message: 'Thời gian kết thúc phải sau thời gian bắt đầu.' });

export type BannerFormValues = z.infer<typeof bannerFormSchema>;
