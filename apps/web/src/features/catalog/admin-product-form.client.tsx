'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { MarkdownPreview } from '@/components/content/markdown-preview.client';
import { normalizeApiError } from '@/lib/http/normalize-error';
import { productFormSchema, type ProductFormValues } from './admin-products.schemas';
import { useAdminProduct, useCreateProduct, useProductFormOptions, useUpdateProduct } from './admin-products.queries.client';
import type { ProductWriteInput } from './admin-products.types';

const emptyValues: ProductFormValues = {
  sku: '', name: '', slug: '', summary: '', description: '', categoryId: '', brandId: '', referencePrice: '',
};
const inputClass = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100';

function payload(values: ProductFormValues): ProductWriteInput {
  return {
    sku: values.sku.toUpperCase(), name: values.name, slug: values.slug,
    summary: values.summary.trim() || null, description: values.description.trim() || null,
    categoryId: values.categoryId || null, brandId: values.brandId || null,
    referencePrice: values.referencePrice || null,
  };
}

export function AdminProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const detail = useAdminProduct(productId);
  const options = useProductFormOptions();
  const create = useCreateProduct();
  const update = useUpdateProduct(productId ?? 'new');
  const form = useForm<ProductFormValues>({ resolver: zodResolver(productFormSchema), defaultValues: emptyValues });
  const description = useWatch({ control: form.control, name: 'description' });

  useEffect(() => {
    if (!productId || !detail.data) return;
    form.reset({
      sku: detail.data.sku, name: detail.data.name, slug: detail.data.slug,
      summary: detail.data.summary ?? '', description: detail.data.description ?? '',
      categoryId: detail.data.categoryId ?? '', brandId: detail.data.brandId ?? '',
      referencePrice: detail.data.referencePrice ?? '',
    });
  }, [detail.data, form, productId]);

  async function submit(values: ProductFormValues) {
    form.clearErrors('root');
    try {
      const product = productId
        ? await update.mutateAsync(payload(values))
        : await create.mutateAsync(payload(values));
      if (!productId) router.replace(`/admin/products/${product.id}/edit`);
    } catch (error) {
      form.setError('root', { message: normalizeApiError(error).message });
    }
  }

  if (productId && detail.isPending) return <p aria-busy="true">Đang tải sản phẩm…</p>;
  if (detail.error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{normalizeApiError(detail.error).message}</p>;
  if (options.isPending) return <p aria-busy="true">Đang tải danh mục và thương hiệu…</p>;
  if (options.error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{normalizeApiError(options.error).message}</p>;

  const busy = create.isPending || update.isPending;
  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
      {form.formState.errors.root?.message && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{form.formState.errors.root.message}</p>}
      <div className="grid gap-5 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm font-semibold">Mã sản phẩm<input {...form.register('sku')} className={inputClass} autoComplete="off" />{form.formState.errors.sku && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.sku.message}</span>}</label>
        <label className="text-sm font-semibold">Slug<input {...form.register('slug')} className={inputClass} autoComplete="off" />{form.formState.errors.slug && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.slug.message}</span>}</label>
        <label className="text-sm font-semibold md:col-span-2">Tên sản phẩm<input {...form.register('name')} className={inputClass} />{form.formState.errors.name && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.name.message}</span>}</label>
        <label className="text-sm font-semibold">Danh mục<select {...form.register('categoryId')} className={inputClass}><option value="">Không chọn</option>{options.data?.categories.map((item) => <option key={item.id} value={item.id}>{'— '.repeat(item.depth)}{item.name}</option>)}</select></label>
        <label className="text-sm font-semibold">Thương hiệu<select {...form.register('brandId')} className={inputClass}><option value="">Không chọn</option>{options.data?.brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="text-sm font-semibold">Giá tham khảo (VND)<input {...form.register('referencePrice')} inputMode="numeric" className={inputClass} placeholder="Để trống nếu cần liên hệ" />{form.formState.errors.referencePrice && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.referencePrice.message}</span>}</label>
        <label className="text-sm font-semibold md:col-span-2">Mô tả ngắn<textarea {...form.register('summary')} rows={3} className={inputClass} />{form.formState.errors.summary && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.summary.message}</span>}</label>
        <label className="text-sm font-semibold md:col-span-2">Mô tả Markdown<textarea {...form.register('description')} rows={12} className={`${inputClass} font-mono text-sm`} />{form.formState.errors.description && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.description.message}</span>}</label>
        {description && <details className="md:col-span-2"><summary className="cursor-pointer font-semibold">Xem trước Markdown</summary><div className="mt-3 rounded-xl border border-stone-200 p-4"><MarkdownPreview source={description} /></div></details>}
      </div>
      <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy} className="rounded-xl bg-orange-600 px-6 py-3 font-bold text-white disabled:opacity-60">{busy ? 'Đang lưu…' : productId ? 'Lưu thay đổi' : 'Tạo sản phẩm'}</button><Link href="/admin/products" className="rounded-xl border border-stone-300 px-6 py-3 font-semibold text-stone-700 no-underline">Quay lại</Link></div>
    </form>
  );
}
