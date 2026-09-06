'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PRIVATE_QUERY_META } from '@/lib/query/query-client';
import { adminProductsApi } from './admin-products.api.client';
import type { AdminProductFilters, ProductWriteInput } from './admin-products.types';

export const adminProductKeys = {
  all: ['admin', 'products'] as const,
  list: (filters: AdminProductFilters) => [...adminProductKeys.all, 'list', filters] as const,
  detail: (id: string) => [...adminProductKeys.all, 'detail', id] as const,
  options: ['admin', 'products', 'options'] as const,
};

export function useAdminProducts(filters: AdminProductFilters) {
  return useQuery({ queryKey: adminProductKeys.list(filters), queryFn: () => adminProductsApi.list(filters), meta: PRIVATE_QUERY_META });
}
export function useAdminProduct(id?: string) {
  return useQuery({
    queryKey: adminProductKeys.detail(id ?? 'none'),
    queryFn: () => adminProductsApi.detail(id!),
    enabled: Boolean(id),
    meta: PRIVATE_QUERY_META,
  });
}
export function useProductFormOptions() {
  return useQuery({ queryKey: adminProductKeys.options, queryFn: adminProductsApi.options, staleTime: 5 * 60_000, meta: PRIVATE_QUERY_META });
}
export function useCreateProduct() {
  const query = useQueryClient();
  return useMutation({ mutationFn: (input: ProductWriteInput) => adminProductsApi.create(input), onSuccess: () => query.invalidateQueries({ queryKey: adminProductKeys.all }) });
}
export function useUpdateProduct(id: string) {
  const query = useQueryClient();
  return useMutation({ mutationFn: (input: ProductWriteInput) => adminProductsApi.update(id, input), onSuccess: async (product) => { query.setQueryData(adminProductKeys.detail(id), product); await query.invalidateQueries({ queryKey: adminProductKeys.all }); } });
}
export function usePublishProduct() {
  const query = useQueryClient();
  return useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminProductsApi.publish(id, isActive), onSuccess: () => query.invalidateQueries({ queryKey: adminProductKeys.all }) });
}
export function useDeleteProduct() {
  const query = useQueryClient();
  return useMutation({ mutationFn: adminProductsApi.remove, onSuccess: () => query.invalidateQueries({ queryKey: adminProductKeys.all }) });
}

export function useProductRelationMutation(id: string) {
  const query = useQueryClient();
  const commit = async (product?: unknown) => {
    if (product) query.setQueryData(adminProductKeys.detail(id), product);
    await query.invalidateQueries({ queryKey: adminProductKeys.all });
  };
  return {
    attachImage: useMutation({ mutationFn: adminProductsApi.attachImage.bind(null, id), onSuccess: commit }),
    updateImage: useMutation({ mutationFn: ({ childId, input }: { childId: string; input: Parameters<typeof adminProductsApi.updateImage>[2] }) => adminProductsApi.updateImage(id, childId, input), onSuccess: commit }),
    removeImage: useMutation({ mutationFn: adminProductsApi.removeImage.bind(null, id), onSuccess: () => commit() }),
    addAttribute: useMutation({ mutationFn: adminProductsApi.addAttribute.bind(null, id), onSuccess: commit }),
    updateAttribute: useMutation({ mutationFn: ({ childId, input }: { childId: string; input: Parameters<typeof adminProductsApi.updateAttribute>[2] }) => adminProductsApi.updateAttribute(id, childId, input), onSuccess: commit }),
    removeAttribute: useMutation({ mutationFn: adminProductsApi.removeAttribute.bind(null, id), onSuccess: () => commit() }),
    setMarketplace: useMutation({ mutationFn: ({ marketplace, input }: { marketplace: Parameters<typeof adminProductsApi.setMarketplace>[1]; input: Parameters<typeof adminProductsApi.setMarketplace>[2] }) => adminProductsApi.setMarketplace(id, marketplace, input), onSuccess: commit }),
    removeMarketplace: useMutation({ mutationFn: adminProductsApi.removeMarketplace.bind(null, id), onSuccess: () => commit() }),
  };
}
