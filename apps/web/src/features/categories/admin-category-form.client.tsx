'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { normalizeApiError } from '@/lib/http/normalize-error';
import { categoryFormSchema, type CategoryFormValues } from './admin-categories.schemas';
import { useAdminCategory, useAdminCategoryTree, useCreateCategory, useUpdateCategory } from './admin-categories.queries.client';
import type { CategoryOption, CategoryWriteInput } from './admin-categories.types';

const emptyValues: CategoryFormValues = {
  name: '', slug: '', description: '', parentId: '', sortOrder: '0', isActive: true,
};
const inputClass = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100';

function optionsFromTree(tree: ReturnType<typeof useAdminCategoryTree>['data']): CategoryOption[] {
  const result: CategoryOption[] = [];
  const visit = (nodes: NonNullable<typeof tree>, depth: number, ancestorIds: string[]) => {
    nodes.forEach((node) => {
      result.push({ id: node.id, name: node.name, depth, ancestorIds });
      visit(node.children, depth + 1, [...ancestorIds, node.id]);
    });
  };
  if (tree) visit(tree, 0, []);
  return result;
}

function payload(values: CategoryFormValues): CategoryWriteInput {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description.trim() || null,
    parentId: values.parentId || null,
    sortOrder: Number(values.sortOrder),
    isActive: values.isActive,
  };
}

export function AdminCategoryForm({ categoryId }: { categoryId?: string }) {
  const router = useRouter();
  const detail = useAdminCategory(categoryId);
  const tree = useAdminCategoryTree();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const form = useForm<CategoryFormValues>({ resolver: zodResolver(categoryFormSchema), defaultValues: emptyValues });

  useEffect(() => {
    if (!categoryId || !detail.data) return;
    form.reset({
      name: detail.data.name,
      slug: detail.data.slug,
      description: detail.data.description ?? '',
      parentId: detail.data.parentId ?? '',
      sortOrder: String(detail.data.sortOrder),
      isActive: detail.data.isActive ?? false,
    });
  }, [categoryId, detail.data, form]);

  async function submit(values: CategoryFormValues) {
    form.clearErrors('root');
    try {
      const category = categoryId
        ? await update.mutateAsync({ id: categoryId, input: payload(values) })
        : await create.mutateAsync(payload(values));
      if (!categoryId) router.replace(`/admin/categories/${category.id}/edit`);
    } catch (error) {
      form.setError('root', { message: normalizeApiError(error).message });
    }
  }

  if ((categoryId && detail.isPending) || tree.isPending) return <p aria-busy="true">Đang tải danh mục…</p>;
  const error = detail.error ?? tree.error;
  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{normalizeApiError(error).message}</p>;
  const parentOptions = optionsFromTree(tree.data).filter((item) => item.id !== categoryId && !item.ancestorIds.includes(categoryId ?? ''));
  const busy = create.isPending || update.isPending;

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
      {form.formState.errors.root?.message && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{form.formState.errors.root.message}</p>}
      <div className="grid gap-5 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm font-semibold">Tên danh mục<input {...form.register('name')} className={inputClass} />{form.formState.errors.name && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.name.message}</span>}</label>
        <label className="text-sm font-semibold">Slug<input {...form.register('slug')} className={inputClass} autoComplete="off" />{form.formState.errors.slug && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.slug.message}</span>}</label>
        <label className="text-sm font-semibold">Danh mục cha<select {...form.register('parentId')} className={inputClass}><option value="">Danh mục gốc</option>{parentOptions.map((item) => <option key={item.id} value={item.id}>{'— '.repeat(item.depth)}{item.name}</option>)}</select>{form.formState.errors.parentId && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.parentId.message}</span>}</label>
        <label className="text-sm font-semibold">Thứ tự<input {...form.register('sortOrder')} inputMode="numeric" className={inputClass} />{form.formState.errors.sortOrder && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.sortOrder.message}</span>}</label>
        <label className="text-sm font-semibold md:col-span-2">Mô tả<textarea {...form.register('description')} rows={6} className={inputClass} />{form.formState.errors.description && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.description.message}</span>}</label>
        <label className="flex items-center gap-3 text-sm font-semibold md:col-span-2"><input type="checkbox" {...form.register('isActive')} className="size-5 accent-orange-600" />Hiển thị danh mục công khai</label>
      </div>
      <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy} className="rounded-xl bg-orange-600 px-6 py-3 font-bold text-white disabled:opacity-60">{busy ? 'Đang lưu…' : categoryId ? 'Lưu thay đổi' : 'Tạo danh mục'}</button><Link href="/admin/categories" className="rounded-xl border border-stone-300 px-6 py-3 font-semibold text-stone-700 no-underline">Quay lại</Link></div>
    </form>
  );
}
