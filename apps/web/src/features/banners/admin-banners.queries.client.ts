'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PRIVATE_QUERY_META } from '@/lib/query/query-client';
import { adminBannersApi } from './admin-banners.api.client';
import type { AdminBannerFilters, BannerUpdateInput, BannerWriteInput } from './admin-banners.types';

export const adminBannerKeys = {
  all: ['admin', 'banners'] as const,
  list: (filters: AdminBannerFilters) => ['admin', 'banners', 'list', filters] as const,
  detail: (id: string) => ['admin', 'banners', 'detail', id] as const,
};
export function useAdminBanners(filters: AdminBannerFilters) {
  return useQuery({ queryKey: adminBannerKeys.list(filters), queryFn: () => adminBannersApi.list(filters), meta: PRIVATE_QUERY_META });
}
export function useAdminBanner(id?: string) {
  return useQuery({ queryKey: adminBannerKeys.detail(id ?? 'none'), queryFn: () => adminBannersApi.detail(id!), enabled: Boolean(id), meta: PRIVATE_QUERY_META });
}
export function useCreateBanner() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: BannerWriteInput) => adminBannersApi.create(input), onSuccess: () => client.invalidateQueries({ queryKey: adminBannerKeys.all }) });
}
export function useUpdateBanner() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: BannerUpdateInput }) => adminBannersApi.update(id, input), onSuccess: async (banner, variables) => { client.setQueryData(adminBannerKeys.detail(variables.id), banner); await client.invalidateQueries({ queryKey: adminBannerKeys.all }); } });
}
export function useDeleteBanner() {
  const client = useQueryClient();
  return useMutation({ mutationFn: adminBannersApi.remove, onSuccess: () => client.invalidateQueries({ queryKey: adminBannerKeys.all }) });
}
