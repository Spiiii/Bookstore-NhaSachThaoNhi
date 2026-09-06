import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminShell } from '@/components/layout/admin-shell.client';
import { AppProviders } from '@/providers';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: { default: `Quản trị ${siteConfig.name}`, template: `%s | Quản trị ${siteConfig.name}` },
  robots: { index: false, follow: false, noarchive: true, noimageindex: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppProviders><AdminShell>{children}</AdminShell></AppProviders>;
}
