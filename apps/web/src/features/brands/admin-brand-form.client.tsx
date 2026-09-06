'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { normalizeApiError } from '@/lib/http/normalize-error';
import { uploadAdminImage } from '@/features/uploads/client';
import { brandFormSchema, type BrandFormValues } from './admin-brands.schemas';
import { useAdminBrand, useCreateBrand, useUpdateBrand } from './admin-brands.queries.client';
import type { BrandWriteInput } from './admin-brands.types';

const emptyValues: BrandFormValues = { name: '', slug: '', description: '', websiteUrl: '', isActive: true };
const inputClass = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100';

function payload(values: BrandFormValues, logoKey: string | null | undefined): BrandWriteInput {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description.trim() || null,
    websiteUrl: values.websiteUrl || null,
    logoKey,
    isActive: values.isActive,
  };
}

export function AdminBrandForm({ brandId }: { brandId?: string }) {
  const router = useRouter();
  const detail = useAdminBrand(brandId);
  const create = useCreateBrand();
  const update = useUpdateBrand();
  const [logo, setLogo] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const form = useForm<BrandFormValues>({ resolver: zodResolver(brandFormSchema), defaultValues: emptyValues });

  useEffect(() => {
    if (!brandId || !detail.data) return;
    form.reset({
      name: detail.data.name,
      slug: detail.data.slug,
      description: detail.data.description ?? '',
      websiteUrl: detail.data.websiteUrl ?? '',
      isActive: detail.data.isActive,
    });
  }, [brandId, detail.data, form]);

  async function submit(values: BrandFormValues) {
    form.clearErrors('root');
    setUploading(Boolean(logo));
    try {
      const logoKey = logo
        ? (await uploadAdminImage(logo)).storageKey
        : removeLogo ? null : detail.data?.logoKey;
      const input = payload(values, logoKey);
      const brand = brandId
        ? await update.mutateAsync({ id: brandId, input })
        : await create.mutateAsync(input);
      if (!brandId) router.replace(`/admin/brands/${brand.id}/edit`);
      setLogo(null);
      setRemoveLogo(false);
    } catch (error) {
      form.setError('root', { message: normalizeApiError(error).message });
    } finally {
      setUploading(false);
    }
  }

  if (brandId && detail.isPending) return <p aria-busy="true">Đang tải thương hiệu…</p>;
  if (detail.error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{normalizeApiError(detail.error).message}</p>;
  const busy = create.isPending || update.isPending || uploading;

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
      {form.formState.errors.root?.message && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{form.formState.errors.root.message}</p>}
      <div className="grid gap-5 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm font-semibold">Tên thương hiệu<input {...form.register('name')} className={inputClass} />{form.formState.errors.name && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.name.message}</span>}</label>
        <label className="text-sm font-semibold">Slug<input {...form.register('slug')} className={inputClass} autoComplete="off" />{form.formState.errors.slug && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.slug.message}</span>}</label>
        <label className="text-sm font-semibold md:col-span-2">Website<input {...form.register('websiteUrl')} type="url" placeholder="https://example.com" className={inputClass} />{form.formState.errors.websiteUrl && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.websiteUrl.message}</span>}</label>
        <label className="text-sm font-semibold md:col-span-2">Mô tả<textarea {...form.register('description')} rows={6} className={inputClass} />{form.formState.errors.description && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.description.message}</span>}</label>
        <div className="space-y-3 md:col-span-2"><label className="block text-sm font-semibold">Logo (PNG, JPEG hoặc WebP)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { setLogo(event.target.files?.[0] ?? null); setRemoveLogo(false); }} className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2`} /></label>{logo && <p className="text-sm text-stone-600">Logo mới: {logo.name}</p>}{detail.data?.logoKey && !logo && <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={removeLogo} onChange={(event) => setRemoveLogo(event.target.checked)} className="size-5 accent-red-600" />Xóa logo hiện tại</label>}</div>
        <label className="flex items-center gap-3 text-sm font-semibold md:col-span-2"><input type="checkbox" {...form.register('isActive')} className="size-5 accent-orange-600" />Hiển thị thương hiệu công khai</label>
      </div>
      <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy} className="rounded-xl bg-orange-600 px-6 py-3 font-bold text-white disabled:opacity-60">{busy ? uploading ? 'Đang tải logo…' : 'Đang lưu…' : brandId ? 'Lưu thay đổi' : 'Tạo thương hiệu'}</button><Link href="/admin/brands" className="rounded-xl border border-stone-300 px-6 py-3 font-semibold text-stone-700 no-underline">Quay lại</Link></div>
    </form>
  );
}
