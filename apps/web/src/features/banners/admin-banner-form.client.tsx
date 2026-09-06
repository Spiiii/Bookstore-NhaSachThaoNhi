'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { uploadAdminImage } from '@/features/uploads/client';
import { normalizeApiError } from '@/lib/http/normalize-error';
import { bannerFormSchema, type BannerFormValues } from './admin-banners.schemas';
import { useAdminBanner, useCreateBanner, useUpdateBanner } from './admin-banners.queries.client';
import type { BannerWriteInput } from './admin-banners.types';

const emptyValues: BannerFormValues = { title: '', altText: '', targetUrl: '', placement: 'home-hero', sortOrder: '0', isActive: false, startAt: '', endAt: '' };
const inputClass = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100';
const localTime = (iso: string | null) => iso ? new Date(iso).toLocaleString('sv-SE').slice(0, 16).replace(' ', 'T') : '';
const isoTime = (local: string) => local ? new Date(local).toISOString() : null;

function payload(values: BannerFormValues, imageKey: string): BannerWriteInput {
  return { title: values.title, imageKey, altText: values.altText, targetUrl: values.targetUrl || null, placement: values.placement, sortOrder: Number(values.sortOrder), isActive: values.isActive, startAt: isoTime(values.startAt), endAt: isoTime(values.endAt) };
}

export function AdminBannerForm({ bannerId }: { bannerId?: string }) {
  const router = useRouter();
  const detail = useAdminBanner(bannerId);
  const create = useCreateBanner();
  const update = useUpdateBanner();
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const form = useForm<BannerFormValues>({ resolver: zodResolver(bannerFormSchema), defaultValues: emptyValues });

  useEffect(() => {
    if (!bannerId || !detail.data) return;
    form.reset({ title: detail.data.title, altText: detail.data.altText, targetUrl: detail.data.targetUrl ?? '', placement: detail.data.placement, sortOrder: String(detail.data.sortOrder), isActive: detail.data.isActive, startAt: localTime(detail.data.startAt), endAt: localTime(detail.data.endAt) });
  }, [bannerId, detail.data, form]);

  async function submit(values: BannerFormValues) {
    form.clearErrors('root');
    if (!image && !detail.data?.imageKey) {
      form.setError('root', { message: 'Ảnh banner là bắt buộc.' });
      return;
    }
    setUploading(Boolean(image));
    try {
      const imageKey = image ? (await uploadAdminImage(image)).storageKey : detail.data!.imageKey;
      const banner = bannerId
        ? await update.mutateAsync({ id: bannerId, input: payload(values, imageKey) })
        : await create.mutateAsync(payload(values, imageKey));
      if (!bannerId) router.replace(`/admin/banners/${banner.id}/edit`);
      setImage(null);
    } catch (error) { form.setError('root', { message: normalizeApiError(error).message }); }
    finally { setUploading(false); }
  }

  if (bannerId && detail.isPending) return <p aria-busy="true">Đang tải banner…</p>;
  if (detail.error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{normalizeApiError(detail.error).message}</p>;
  const busy = create.isPending || update.isPending || uploading;
  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
      {form.formState.errors.root?.message && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{form.formState.errors.root.message}</p>}
      <div className="grid gap-5 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm font-semibold md:col-span-2">Tên nội bộ<input {...form.register('title')} className={inputClass} />{form.formState.errors.title && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.title.message}</span>}</label>
        <label className="text-sm font-semibold">Placement<input {...form.register('placement')} className={inputClass} autoComplete="off" />{form.formState.errors.placement && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.placement.message}</span>}<span className="mt-1 block text-xs font-normal text-stone-500">Phải thuộc allowlist cấu hình của API.</span></label>
        <label className="text-sm font-semibold">Thứ tự<input {...form.register('sortOrder')} inputMode="numeric" className={inputClass} />{form.formState.errors.sortOrder && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.sortOrder.message}</span>}</label>
        <label className="text-sm font-semibold md:col-span-2">Alt text<input {...form.register('altText')} className={inputClass} /><span className="mt-1 block text-xs font-normal text-stone-500">Để trống nếu ảnh chỉ dùng để trang trí.</span>{form.formState.errors.altText && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.altText.message}</span>}</label>
        <label className="text-sm font-semibold md:col-span-2">Liên kết đích<input {...form.register('targetUrl')} placeholder="/products hoặc https://example.com" className={inputClass} />{form.formState.errors.targetUrl && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.targetUrl.message}</span>}</label>
        <label className="text-sm font-semibold">Bắt đầu hiển thị<input type="datetime-local" {...form.register('startAt')} className={inputClass} />{form.formState.errors.startAt && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.startAt.message}</span>}</label>
        <label className="text-sm font-semibold">Kết thúc hiển thị<input type="datetime-local" {...form.register('endAt')} className={inputClass} />{form.formState.errors.endAt && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.endAt.message}</span>}</label>
        <div className="md:col-span-2"><label className="block text-sm font-semibold">Ảnh banner {bannerId ? '' : '(bắt buộc)'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2`} /></label>{image ? <p className="mt-2 text-sm text-stone-600">Ảnh mới: {image.name}</p> : detail.data?.imageKey && <p className="mt-2 text-sm text-stone-600">Đang sử dụng ảnh hiện tại.</p>}</div>
        <label className="flex items-center gap-3 text-sm font-semibold md:col-span-2"><input type="checkbox" {...form.register('isActive')} className="size-5 accent-orange-600" />Bật banner</label>
      </div>
      <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy} className="rounded-xl bg-orange-600 px-6 py-3 font-bold text-white disabled:opacity-60">{busy ? uploading ? 'Đang tải ảnh…' : 'Đang lưu…' : bannerId ? 'Lưu thay đổi' : 'Tạo banner'}</button><Link href="/admin/banners" className="rounded-xl border border-stone-300 px-6 py-3 font-semibold text-stone-700 no-underline">Quay lại</Link></div>
    </form>
  );
}
