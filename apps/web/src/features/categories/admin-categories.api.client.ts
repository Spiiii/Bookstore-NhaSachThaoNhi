'use client';

import { z } from 'zod';
import { getBrowserClient } from '@/lib/http/browser-client';
import { adminCategorySchema, adminCategoryTreeSchema } from './admin-categories.schemas';
import type { CategoryUpdateInput, CategoryWriteInput } from './admin-categories.types';

export const adminCategoriesApi = {
  async tree() {
    return z.array(adminCategoryTreeSchema).parse((await getBrowserClient().get('/admin/categories/tree')).data);
  },
  async detail(id: string) {
    return adminCategorySchema.parse((await getBrowserClient().get(`/admin/categories/${id}`)).data);
  },
  async create(input: CategoryWriteInput) {
    return adminCategorySchema.parse((await getBrowserClient().post('/admin/categories', input)).data);
  },
  async update(id: string, input: CategoryUpdateInput) {
    return adminCategorySchema.parse((await getBrowserClient().patch(`/admin/categories/${id}`, input)).data);
  },
  async remove(id: string) {
    await getBrowserClient().delete(`/admin/categories/${id}`);
  },
};
