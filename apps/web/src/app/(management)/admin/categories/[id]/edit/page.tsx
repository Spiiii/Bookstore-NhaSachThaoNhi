import { AdminCategoryForm } from '@/features/categories/client';

export const metadata = { title: 'Chỉnh sửa danh mục' };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-orange-700">Catalog</p>
        <h1 className="mt-1 text-3xl font-black">Chỉnh sửa danh mục</h1>
      </div>
      <AdminCategoryForm categoryId={(await params).id} />
    </section>
  );
}
