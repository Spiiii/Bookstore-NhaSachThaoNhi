import { z } from 'zod';

const section = z.object({ total: z.number().int().nonnegative(), active: z.number().int().nonnegative() });

export const dashboardSchema = z.object({
  products: section.extend({ missingImages: z.number().int().nonnegative() }),
  categories: section,
  brands: section,
  news: z.object({
    total: z.number().int().nonnegative(),
    published: z.number().int().nonnegative(),
    draft: z.number().int().nonnegative(),
    archived: z.number().int().nonnegative(),
  }),
  banners: section,
  generatedAt: z.iso.datetime(),
});

export type DashboardSummary = z.infer<typeof dashboardSchema>;
