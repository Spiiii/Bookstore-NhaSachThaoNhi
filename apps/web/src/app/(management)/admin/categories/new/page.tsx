import { AdminCategoryForm } from '@/features/categories/client';

export const metadata = { title: 'Thêm danh mục' };

export default function NewCategoryPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-orange-700">Catalog</p>
        <h1 className="mt-1 text-3xl font-black">Thêm danh mục</h1>
        <p className="mt-2 text-stone-600">Có thể tạo danh mục gốc hoặc đặt dưới một danh mục hiện có.</p>
      </div>
      <AdminCategoryForm />
    </section>
  );
}
