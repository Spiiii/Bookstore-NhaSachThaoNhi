import { Suspense } from 'react';
import { AdminBannersTable } from '@/features/banners/client';

export const metadata = { title: 'Banners' };

export default function AdminBannersPage() {
  return <Suspense fallback={<p aria-busy="true">Đang tải banners…</p>}><AdminBannersTable /></Suspense>;
}
