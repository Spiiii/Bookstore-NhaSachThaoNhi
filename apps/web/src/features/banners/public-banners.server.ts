import 'server-only';
import { z } from 'zod';
import { getPublicApi } from '@/lib/http/public-api.server';

const targetUrl = z.string().refine((value) => /^\/(?!\/)/.test(value) || /^https:\/\//i.test(value));
const bannerSchema = z.object({
  id: z.uuid(), imageUrl: z.string().regex(/^\/(?!\/)/), altText: z.string(), targetUrl: targetUrl.nullable(),
  placement: z.string(), sortOrder: z.number().int(),
});
const pageSchema = z.object({
  items: z.array(bannerSchema), page: z.number().int(), limit: z.number().int(), hasMore: z.boolean(),
});
export type PublicBanner = z.infer<typeof bannerSchema>;
export async function listHomeBanners() {
  return (await getPublicApi('/banners?page=1&limit=10&placement=home-hero', pageSchema)).items;
}
