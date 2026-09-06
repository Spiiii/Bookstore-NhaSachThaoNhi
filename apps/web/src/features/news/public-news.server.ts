import 'server-only';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import type { components } from '@bookstore/contracts';

type NewsProjection = Pick<
  components['schemas']['NewsResponseDto'],
  'id' | 'title' | 'slug' | 'excerpt' | 'content' | 'coverUrl' | 'publishedAt' | 'updatedAt'
>;

const article = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().nullable(),
  content: z.string().optional(),
  coverUrl: z.string().nullable(),
  publishedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}) satisfies z.ZodType<NewsProjection>;
export type PublicNews = z.infer<typeof article>;
const pageSchema = z.object({ items: z.array(article), hasMore: z.boolean() });

export function newsOrigins() {
  const site = new URL(process.env.SITE_URL ?? '');
  const api = new URL(process.env.API_BASE_URL ?? '');
  for (const url of [site, api]) {
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error('Invalid public origin configuration.');
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')
      throw new Error('Production origins require HTTPS.');
  }
  if (site.pathname !== '/') throw new Error('SITE_URL must be a website origin without a path.');
  return { site: site.origin, api: api.toString().replace(/\/$/, '') };
}
async function request(path: string) {
  const response = await fetch(newsOrigins().api + path, {
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
    redirect: 'error',
  });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error('News API is unavailable.');
  return response.json() as Promise<unknown>;
}
export const getPublicNews = cache(async (slug: string): Promise<PublicNews> => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();
  const item = article.parse(await request('/news/by-slug/' + encodeURIComponent(slug)));
  if (item.content === undefined || new Date(item.publishedAt).getTime() > Date.now()) notFound();
  return item;
});
export async function listPublicNews(page = 1) {
  return pageSchema.parse(await request('/news?page=' + page + '&limit=50'));
}
