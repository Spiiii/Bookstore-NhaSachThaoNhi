import { AdminBrandForm } from '@/features/brands/client';

export const metadata = { title: 'Thêm thương hiệu' };

export default function NewBrandPage() {
  return <section className="space-y-6"><div><p className="text-sm font-bold uppercase tracking-widest text-orange-700">Catalog</p><h1 className="mt-1 text-3xl font-black">Thêm thương hiệu</h1></div><AdminBrandForm /></section>;
}
