import { AdminBrandForm } from '@/features/brands/client';

export const metadata = { title: 'Chỉnh sửa thương hiệu' };

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  return <section className="space-y-6"><div><p className="text-sm font-bold uppercase tracking-widest text-orange-700">Catalog</p><h1 className="mt-1 text-3xl font-black">Chỉnh sửa thương hiệu</h1></div><AdminBrandForm brandId={(await params).id} /></section>;
}
