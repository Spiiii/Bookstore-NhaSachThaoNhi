import { AdminProductForm, AdminProductRelations } from '@/features/catalog/client';

export const metadata = { title: 'Chỉnh sửa sản phẩm' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <section className="space-y-6">
      <div><p className="text-sm font-bold uppercase tracking-widest text-orange-700">Catalog</p><h1 className="mt-1 text-3xl font-black">Chỉnh sửa sản phẩm</h1></div>
      <AdminProductForm productId={id} />
      <AdminProductRelations productId={id} />
    </section>
  );
}
