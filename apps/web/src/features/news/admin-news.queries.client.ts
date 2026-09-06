'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PRIVATE_QUERY_META } from '@/lib/query/query-client';
import { adminNewsApi } from './admin-news.api.client';
import type { AdminNewsFilters, NewsPublicationInput, NewsUpdateInput, NewsWriteInput } from './admin-news.types';

export const adminNewsKeys = {
  all: ['admin', 'news'] as const,
  list: (filters: AdminNewsFilters) => ['admin', 'news', 'list', filters] as const,
  detail: (id: string) => ['admin', 'news', 'detail', id] as const,
};

export function useAdminNewsList(filters: AdminNewsFilters) {
  return useQuery({ queryKey: adminNewsKeys.list(filters), queryFn: () => adminNewsApi.list(filters), meta: PRIVATE_QUERY_META });
}
export function useAdminNews(id?: string) {
  return useQuery({ queryKey: adminNewsKeys.detail(id ?? 'none'), queryFn: () => adminNewsApi.detail(id!), enabled: Boolean(id), meta: PRIVATE_QUERY_META });
}
export function useCreateNews() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: NewsWriteInput) => adminNewsApi.create(input), onSuccess: () => client.invalidateQueries({ queryKey: adminNewsKeys.all }) });
}
export function useUpdateNews() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: NewsUpdateInput }) => adminNewsApi.update(id, input), onSuccess: async (news, variables) => { client.setQueryData(adminNewsKeys.detail(variables.id), news); await client.invalidateQueries({ queryKey: adminNewsKeys.all }); } });
}
export function useNewsPublication() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: NewsPublicationInput }) => adminNewsApi.publication(id, input), onSuccess: async (news, variables) => { client.setQueryData(adminNewsKeys.detail(variables.id), news); await client.invalidateQueries({ queryKey: adminNewsKeys.all }); } });
}
export function useDeleteNews() {
  const client = useQueryClient();
  return useMutation({ mutationFn: adminNewsApi.remove, onSuccess: () => client.invalidateQueries({ queryKey: adminNewsKeys.all }) });
}
