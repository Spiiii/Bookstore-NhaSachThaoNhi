'use client';

import { getBrowserClient } from '@/lib/http/browser-client';
import { adminBrandPageSchema, adminBrandSchema } from './admin-brands.schemas';
import type { AdminBrandFilters, BrandUpdateInput, BrandWriteInput } from './admin-brands.types';

export const adminBrandsApi = {
  async list(filters: AdminBrandFilters) {
    const response = await getBrowserClient().get('/admin/brands', { params: { ...filters, limit: 20 } });
    return adminBrandPageSchema.parse(response.data);
  },
  async detail(id: string) {
    return adminBrandSchema.parse((await getBrowserClient().get(`/admin/brands/${id}`)).data);
  },
  async create(input: BrandWriteInput) {
    return adminBrandSchema.parse((await getBrowserClient().post('/admin/brands', input)).data);
  },
  async update(id: string, input: BrandUpdateInput) {
    return adminBrandSchema.parse((await getBrowserClient().patch(`/admin/brands/${id}`, input)).data);
  },
  async remove(id: string) {
    await getBrowserClient().delete(`/admin/brands/${id}`);
  },
};
