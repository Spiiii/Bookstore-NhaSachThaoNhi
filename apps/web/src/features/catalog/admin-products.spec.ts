import { describe, expect, it } from 'vitest';
import { productFormSchema } from './admin-products.schemas';

const valid = {
  sku: 'BOOK-001', name: 'Sản phẩm mẫu', slug: 'san-pham-mau',
  summary: '', description: '', categoryId: '', brandId: '', referencePrice: '',
};

describe('Admin product form contract', () => {
  it('accepts empty optional relations and contact pricing', () => {
    expect(productFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects unsafe slugs and non-integer VND prices', () => {
    expect(productFormSchema.safeParse({ ...valid, slug: 'Invalid Slug' }).success).toBe(false);
    expect(productFormSchema.safeParse({ ...valid, referencePrice: '10.50' }).success).toBe(false);
  });
});
