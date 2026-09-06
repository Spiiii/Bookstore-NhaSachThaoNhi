'use client';

import { QueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@/lib/http/normalize-error';

export const PRIVATE_QUERY_META = { scope: 'private' } as const;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (count, error) => !(error instanceof ApiClientError && (error.status ?? 500) < 500) && count < 2,
      },
      mutations: { retry: false },
    },
  });
}

export async function clearPrivateQueryState(client: QueryClient): Promise<void> {
  const predicate = (query: { meta?: Readonly<Record<string, unknown>> }): boolean =>
    query.meta?.scope === 'private';
  const cancellation = client.cancelQueries({ predicate });
  client.removeQueries({ predicate });
  client.getMutationCache().clear();
  await cancellation;
}
