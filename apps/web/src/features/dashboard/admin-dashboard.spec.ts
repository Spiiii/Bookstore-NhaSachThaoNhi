import { describe, expect, it } from 'vitest';
import { dashboardSchema } from './admin-dashboard.schema';

describe('dashboardSchema', () => {
  it('accepts a complete non-negative summary', () => {
    expect(dashboardSchema.parse({
      products: { total: 4, active: 3, missingImages: 1 },
      categories: { total: 2, active: 2 },
      brands: { total: 1, active: 1 },
      news: { total: 3, published: 1, draft: 1, archived: 1 },
      banners: { total: 2, active: 1 },
      generatedAt: '2026-09-06T00:00:00.000Z',
    }).products.missingImages).toBe(1);
  });

  it('rejects negative counts', () => {
    expect(() => dashboardSchema.parse({
      products: { total: -1, active: 0, missingImages: 0 }, categories: { total: 0, active: 0 },
      brands: { total: 0, active: 0 }, news: { total: 0, published: 0, draft: 0, archived: 0 },
      banners: { total: 0, active: 0 }, generatedAt: '2026-09-06T00:00:00.000Z',
    })).toThrow();
  });
});
