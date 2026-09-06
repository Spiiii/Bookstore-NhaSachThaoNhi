import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));
import { getPublicNews, newsOrigins } from '../src/features/news/server';
import { newsMetadata } from '../src/features/news/server';
import { pageMetadata } from '../src/config/seo.server';
const item = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Article',
  slug: 'article',
  excerpt: 'Summary',
  content: '# Text',
  coverUrl: '/news/by-slug/article/cover',
  publishedAt: '2020-01-01T00:00:00Z',
  updatedAt: '2020-01-02T00:00:00Z',
};
describe('News SEO and visibility', () => {
  it('uses configured origins and API prefix', () => {
    const metadata = newsMetadata(item, {
      site: 'https://books.test',
      api: 'https://api.test/api',
    });
    expect(metadata.alternates?.canonical).toBe('https://books.test/news/article');
    expect(metadata.openGraph).toMatchObject({
      type: 'article',
      images: [{ url: 'https://api.test/api/news/by-slug/article/cover' }],
    });
  });
  it('fetches public data without caching and rejects hidden content', async () => {
    vi.stubEnv('SITE_URL', 'https://books.test');
    vi.stubEnv('API_BASE_URL', 'https://api.test/api');
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(item), { status: 200 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(getPublicNews('article')).resolves.toMatchObject({ slug: 'article' });
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.test/api/news/by-slug/article',
      expect.objectContaining({ cache: 'no-store', redirect: 'error' }),
    );
    fetcher.mockResolvedValue(new Response('', { status: 404 }));
    await expect(getPublicNews('hidden')).rejects.toThrow('NOT_FOUND');
    fetcher.mockResolvedValue(
      new Response(JSON.stringify({ ...item, publishedAt: '2099-01-01T00:00:00Z' })),
    );
    await expect(getPublicNews('future')).rejects.toThrow('NOT_FOUND');
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  it('rejects credentials or a path in the canonical origin', () => {
    vi.stubEnv('SITE_URL', 'https://user:pass@books.test');
    vi.stubEnv('API_BASE_URL', 'https://api.test');
    expect(() => newsOrigins()).toThrow();
    vi.unstubAllEnvs();
  });
  it('uses an absolute home title and noindexes filtered listing pages', () => {
    vi.stubEnv('SITE_URL', 'https://books.test');
    const home = pageMetadata({ path: '/', absoluteTitle: true });
    const filtered = pageMetadata({ path: '/products', title: 'Sản phẩm', noIndex: true });
    expect(home.title).toEqual({ absolute: 'Nhà sách' });
    expect(filtered.robots).toEqual({ index: false, follow: false });
    expect(filtered.alternates?.canonical).toBe('https://books.test/products');
    vi.unstubAllEnvs();
  });
});
