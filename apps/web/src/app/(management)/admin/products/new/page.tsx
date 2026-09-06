import { AdminProductForm } from '@/features/catalog/client';

export const metadata = { title: 'Thêm sản phẩm' };

export default function NewProductPage() {
  return (
    <section className="space-y-6">
      <div><p className="text-sm font-bold uppercase tracking-widest text-orange-700">Catalog</p><h1 className="mt-1 text-3xl font-black">Thêm sản phẩm</h1><p className="mt-2 text-stone-600">Sản phẩm mới được tạo ở trạng thái ẩn.</p></div>
      <AdminProductForm />
    </section>
  );
}
