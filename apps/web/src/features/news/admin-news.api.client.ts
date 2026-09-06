'use client';

import { getBrowserClient } from '@/lib/http/browser-client';
import { adminNewsPageSchema, adminNewsSchema } from './admin-news.schemas';
import type { AdminNewsFilters, NewsPublicationInput, NewsUpdateInput, NewsWriteInput } from './admin-news.types';

export const adminNewsApi = {
  async list(filters: AdminNewsFilters) {
    return adminNewsPageSchema.parse((await getBrowserClient().get('/admin/news', { params: { ...filters, limit: 20 } })).data);
  },
  async detail(id: string) {
    return adminNewsSchema.parse((await getBrowserClient().get(`/admin/news/${id}`)).data);
  },
  async create(input: NewsWriteInput) {
    return adminNewsSchema.parse((await getBrowserClient().post('/admin/news', input)).data);
  },
  async update(id: string, input: NewsUpdateInput) {
    return adminNewsSchema.parse((await getBrowserClient().patch(`/admin/news/${id}`, input)).data);
  },
  async publication(id: string, input: NewsPublicationInput) {
    return adminNewsSchema.parse((await getBrowserClient().patch(`/admin/news/${id}/publication`, input)).data);
  },
  async remove(id: string) {
    await getBrowserClient().delete(`/admin/news/${id}`);
  },
};
