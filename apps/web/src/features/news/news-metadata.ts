import type { Metadata } from 'next';
import { pageMetadata } from '@/config/seo.server';
import type { PublicNews } from './public-news.server';

export function newsMetadata(item: PublicNews, origins: { site: string; api: string }): Metadata {
  return pageMetadata({
    title: item.title,
    description: item.excerpt?.trim() || undefined,
    path: '/news/' + encodeURIComponent(item.slug),
    imagePath: item.coverUrl ? '/news/by-slug/' + encodeURIComponent(item.slug) + '/cover' : null,
    type: 'article',
    publishedTime: item.publishedAt,
    modifiedTime: item.updatedAt,
    siteBase: origins.site,
    apiBase: origins.api,
  });
}
