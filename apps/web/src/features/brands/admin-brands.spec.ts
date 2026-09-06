import { describe, expect, it } from 'vitest';
import { adminBrandPageSchema, brandFormSchema } from './admin-brands.schemas';

describe('admin brand validation', () => {
  it('accepts the admin list contract', () => {
    const result = adminBrandPageSchema.parse({ items: [{ id: 'b9b7e7aa-d128-4e40-a156-87e8dc872781', name: 'Acme', slug: 'acme', description: null, websiteUrl: null, logoUrl: null, logoKey: null, isActive: true, createdAt: '2026-09-04T00:00:00.000Z', updatedAt: '2026-09-04T00:00:00.000Z' }], page: 1, limit: 20, hasMore: false });
    expect(result.items[0]?.name).toBe('Acme');
  });

  it('requires HTTPS websites and canonical slugs', () => {
    const result = brandFormSchema.safeParse({ name: 'Acme', slug: 'Acme Brand', description: '', websiteUrl: 'http://example.com', isActive: true });
    expect(result.success).toBe(false);
  });
});
