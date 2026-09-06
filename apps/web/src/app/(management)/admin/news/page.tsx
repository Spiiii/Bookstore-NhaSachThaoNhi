import { Suspense } from 'react';
import { AdminNewsTable } from '@/features/news/client';

export const metadata = { title: 'Tin tức' };

export default function AdminNewsPage() {
  return <Suspense fallback={<p aria-busy="true">Đang tải bài viết…</p>}><AdminNewsTable /></Suspense>;
}
