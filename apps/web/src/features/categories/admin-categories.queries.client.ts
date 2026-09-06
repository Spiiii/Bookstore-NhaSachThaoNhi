'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PRIVATE_QUERY_META } from '@/lib/query/query-client';
import { adminCategoriesApi } from './admin-categories.api.client';
import type { CategoryUpdateInput, CategoryWriteInput } from './admin-categories.types';

export const adminCategoryKeys = {
  all: ['admin', 'categories'] as const,
  tree: ['admin', 'categories', 'tree'] as const,
  detail: (id: string) => ['admin', 'categories', 'detail', id] as const,
};

export function useAdminCategoryTree() {
  return useQuery({ queryKey: adminCategoryKeys.tree, queryFn: adminCategoriesApi.tree, meta: PRIVATE_QUERY_META });
}
export function useAdminCategory(id?: string) {
  return useQuery({ queryKey: adminCategoryKeys.detail(id ?? 'none'), queryFn: () => adminCategoriesApi.detail(id!), enabled: Boolean(id), meta: PRIVATE_QUERY_META });
}
export function useCreateCategory() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: CategoryWriteInput) => adminCategoriesApi.create(input), onSuccess: () => client.invalidateQueries({ queryKey: adminCategoryKeys.all }) });
}
export function useUpdateCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryUpdateInput }) => adminCategoriesApi.update(id, input),
    onSuccess: async (category, variables) => {
      client.setQueryData(adminCategoryKeys.detail(variables.id), category);
      await client.invalidateQueries({ queryKey: adminCategoryKeys.all });
    },
  });
}
export function useDeleteCategory() {
  const client = useQueryClient();
  return useMutation({ mutationFn: adminCategoriesApi.remove, onSuccess: () => client.invalidateQueries({ queryKey: adminCategoryKeys.all }) });
}
