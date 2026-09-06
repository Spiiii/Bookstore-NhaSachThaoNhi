'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from './auth-provider.client';
import { QueryProvider } from './query-provider.client';

export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryProvider><AuthProvider>{children}</AuthProvider></QueryProvider>;
}
