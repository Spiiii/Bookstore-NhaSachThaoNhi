import 'server-only';
import { z } from 'zod';
import { getPublicApi } from '@/lib/http/public-api.server';

const brandSchema = z.object({
  id: z.uuid(), name: z.string(), slug: z.string(), description: z.string().nullable(),
  websiteUrl: z.url().nullable(), logoUrl: z.string().nullable(),
});
const pageSchema = z.object({
  items: z.array(brandSchema), page: z.number().int(), limit: z.number().int(), hasMore: z.boolean(),
});
export type PublicBrand = z.infer<typeof brandSchema>;
export async function listPublicBrands() {
  const result: PublicBrand[] = [];
  for (let page = 1; page <= 10_000; page += 1) {
    const current = await getPublicApi(`/brands?page=${page}&limit=50`, pageSchema);
    result.push(...current.items);
    if (!current.hasMore) return result;
  }
  throw new Error('Brand pagination exceeds the supported API limit.');
}
