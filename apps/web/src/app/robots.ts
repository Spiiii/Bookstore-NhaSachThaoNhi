import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/config/seo.server';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: origin + '/sitemap.xml',
  };
}
