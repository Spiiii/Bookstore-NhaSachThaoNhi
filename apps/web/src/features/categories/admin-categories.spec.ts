import { describe, expect, it } from 'vitest';
import { adminCategoryTreeSchema, categoryFormSchema } from './admin-categories.schemas';

describe('admin category validation', () => {
  it('accepts a nested category tree from the API', () => {
    const category = {
      id: 'b9b7e7aa-d128-4e40-a156-87e8dc872781',
      name: 'Sách thiếu nhi',
      slug: 'sach-thieu-nhi',
      description: null,
      parentId: null,
      sortOrder: 0,
      isActive: true,
      createdAt: '2026-09-04T00:00:00.000Z',
      updatedAt: '2026-09-04T00:00:00.000Z',
      treeParentId: null,
      children: [],
    };

    expect(adminCategoryTreeSchema.parse(category).treeParentId).toBeNull();
  });

  it('rejects an invalid slug and negative sort order', () => {
    const result = categoryFormSchema.safeParse({
      name: 'Sách',
      slug: 'Sách Có Dấu',
      description: '',
      parentId: '',
      sortOrder: '-1',
      isActive: true,
    });

    expect(result.success).toBe(false);
  });
});
