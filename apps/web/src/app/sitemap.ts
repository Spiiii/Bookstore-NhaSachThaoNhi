import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/config/seo.server';
import { listPublicProducts } from '@/features/catalog/server';
import { listPublicNews } from '@/features/news/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const MAX_URLS = 50_000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const entries: MetadataRoute.Sitemap = [
    { url: origin },
    { url: origin + '/products' },
    { url: origin + '/news' },
    { url: origin + '/contact' },
  ];
  const seen = new Set<string>();

  for (let page = 1; page <= 10_000; page += 1) {
    const data = await listPublicProducts({ page, limit: 50 });
    for (const item of data.items) {
      if (!seen.has(`product:${item.id}`)) {
        if (entries.length >= MAX_URLS) throw new Error('Partition sitemap before exceeding 50000 URLs.');
        seen.add(`product:${item.id}`);
        entries.push({ url: `${origin}/products/${item.slug}` });
      }
    }
    if (!data.hasMore) break;
    if (page === 10_000) throw new Error('Product sitemap exceeds the API pagination limit.');
  }

  for (let page = 1; page <= 10_000; page += 1) {
    const data = await listPublicNews(page);
    for (const item of data.items) {
      if (!seen.has(`news:${item.id}`)) {
        if (entries.length >= MAX_URLS) throw new Error('Partition sitemap before exceeding 50000 URLs.');
        seen.add(`news:${item.id}`);
        entries.push({ url: `${origin}/news/${item.slug}`, lastModified: item.updatedAt });
      }
    }
    if (!data.hasMore) return entries;
  }
  throw new Error('News sitemap exceeds the API pagination limit.');
}
