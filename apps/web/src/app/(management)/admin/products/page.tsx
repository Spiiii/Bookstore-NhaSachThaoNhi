import { Suspense } from 'react';
import { AdminProductsTable } from '@/features/catalog/client';

export const metadata = { title: 'Sản phẩm' };

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<p aria-busy="true">Đang tải danh sách sản phẩm…</p>}>
      <AdminProductsTable />
    </Suspense>
  );
}
