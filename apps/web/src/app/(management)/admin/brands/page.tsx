import { Suspense } from 'react';
import { AdminBrandsTable } from '@/features/brands/client';

export const metadata = { title: 'Thương hiệu' };

export default function AdminBrandsPage() {
  return <Suspense fallback={<p aria-busy="true">Đang tải thương hiệu…</p>}><AdminBrandsTable /></Suspense>;
}
