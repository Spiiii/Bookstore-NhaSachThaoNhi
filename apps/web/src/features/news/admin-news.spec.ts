import { describe, expect, it } from 'vitest';
import { adminNewsPageSchema, newsFormSchema } from './admin-news.schemas';

describe('admin news validation', () => {
  it('accepts the admin list contract', () => {
    const item = { id: 'b9b7e7aa-d128-4e40-a156-87e8dc872781', title: 'Khai trương', slug: 'khai-truong', excerpt: null, coverUrl: null, coverKey: null, publishedAt: null, updatedAt: '2026-09-04T00:00:00.000Z', createdAt: '2026-09-04T00:00:00.000Z', authorId: 'c9b7e7aa-d128-4e40-a156-87e8dc872782', status: 'DRAFT', seo: { title: 'Khai trương', description: null, canonicalPath: '/news/khai-truong', imageUrl: null, type: 'article', noIndex: true } };
    expect(adminNewsPageSchema.parse({ items: [item], page: 1, limit: 20, hasMore: false }).items[0]?.status).toBe('DRAFT');
  });

  it('rejects empty Markdown and non-canonical slugs', () => {
    const result = newsFormSchema.safeParse({ title: 'Tin mới', slug: 'Tin Mới', excerpt: '', content: ' ', status: 'DRAFT', publishedAt: '' });
    expect(result.success).toBe(false);
  });
});
