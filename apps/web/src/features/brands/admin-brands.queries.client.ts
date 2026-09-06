'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PRIVATE_QUERY_META } from '@/lib/query/query-client';
import { adminBrandsApi } from './admin-brands.api.client';
import type { AdminBrandFilters, BrandUpdateInput, BrandWriteInput } from './admin-brands.types';

export const adminBrandKeys = {
  all: ['admin', 'brands'] as const,
  list: (filters: AdminBrandFilters) => ['admin', 'brands', 'list', filters] as const,
  detail: (id: string) => ['admin', 'brands', 'detail', id] as const,
};

export function useAdminBrands(filters: AdminBrandFilters) {
  return useQuery({ queryKey: adminBrandKeys.list(filters), queryFn: () => adminBrandsApi.list(filters), meta: PRIVATE_QUERY_META });
}
export function useAdminBrand(id?: string) {
  return useQuery({ queryKey: adminBrandKeys.detail(id ?? 'none'), queryFn: () => adminBrandsApi.detail(id!), enabled: Boolean(id), meta: PRIVATE_QUERY_META });
}
export function useCreateBrand() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: BrandWriteInput) => adminBrandsApi.create(input), onSuccess: () => client.invalidateQueries({ queryKey: adminBrandKeys.all }) });
}
export function useUpdateBrand() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BrandUpdateInput }) => adminBrandsApi.update(id, input),
    onSuccess: async (brand, variables) => {
      client.setQueryData(adminBrandKeys.detail(variables.id), brand);
      await client.invalidateQueries({ queryKey: adminBrandKeys.all });
    },
  });
}
export function useDeleteBrand() {
  const client = useQueryClient();
  return useMutation({ mutationFn: adminBrandsApi.remove, onSuccess: () => client.invalidateQueries({ queryKey: adminBrandKeys.all }) });
}
