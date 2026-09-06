import 'server-only';

import { notFound } from 'next/navigation';
import type { ZodType } from 'zod';
import { ApiClientError } from './normalize-error';
import { getServerApiBaseUrl, getServerClient } from './server-client';

export async function getPublicApi<T>(path: string, schema: ZodType<T>): Promise<T> {
  try {
    const response = await getServerClient().get<unknown>(path);
    return schema.parse(response.data);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) notFound();
    throw error;
  }
}

export function publicMediaUrl(path: string | null): string | null {
  if (path === null) return null;
  if (!/^\/(?!\/)/.test(path)) throw new Error('API media path must be site-root-relative.');
  return getServerApiBaseUrl() + path;
}
