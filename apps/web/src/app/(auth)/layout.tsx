import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppProviders } from '@/providers';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
