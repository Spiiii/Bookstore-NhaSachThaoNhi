import { describe, expect, it } from 'vitest';
import { adminBannerPageSchema, bannerFormSchema } from './admin-banners.schemas';

describe('admin banner validation', () => {
  it('accepts the admin list contract', () => {
    const item = { id: 'b9b7e7aa-d128-4e40-a156-87e8dc872781', title: 'Hero', imageUrl: '/admin/banners/id/image', imageKey: 'c9b7e7aa-d128-4e40-a156-87e8dc872782', altText: '', targetUrl: '/products', placement: 'home-hero', sortOrder: 0, isActive: false, startAt: null, endAt: null, createdAt: '2026-09-04T00:00:00.000Z', updatedAt: '2026-09-04T00:00:00.000Z' };
    expect(adminBannerPageSchema.parse({ items: [item], page: 1, limit: 20, hasMore: false }).items[0]?.placement).toBe('home-hero');
  });

  it('rejects an inverted visibility window', () => {
    const result = bannerFormSchema.safeParse({ title: 'Hero', altText: '', targetUrl: '/products', placement: 'home-hero', sortOrder: '0', isActive: true, startAt: '2026-09-05T12:00', endAt: '2026-09-04T12:00' });
    expect(result.success).toBe(false);
  });
});
