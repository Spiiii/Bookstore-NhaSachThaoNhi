'use client';

import { getBrowserClient } from '@/lib/http/browser-client';
import { adminBannerPageSchema, adminBannerSchema } from './admin-banners.schemas';
import type { AdminBannerFilters, BannerUpdateInput, BannerWriteInput } from './admin-banners.types';

export const adminBannersApi = {
  async list(filters: AdminBannerFilters) {
    return adminBannerPageSchema.parse((await getBrowserClient().get('/admin/banners', { params: { ...filters, limit: 20 } })).data);
  },
  async detail(id: string) {
    return adminBannerSchema.parse((await getBrowserClient().get(`/admin/banners/${id}`)).data);
  },
  async create(input: BannerWriteInput) {
    return adminBannerSchema.parse((await getBrowserClient().post('/admin/banners', input)).data);
  },
  async update(id: string, input: BannerUpdateInput) {
    return adminBannerSchema.parse((await getBrowserClient().patch(`/admin/banners/${id}`, input)).data);
  },
  async remove(id: string) {
    await getBrowserClient().delete(`/admin/banners/${id}`);
  },
};
