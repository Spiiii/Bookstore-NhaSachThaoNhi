'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { MarkdownPreview } from '@/components/content/markdown-preview.client';
import { uploadAdminImage } from '@/features/uploads/client';
import { normalizeApiError } from '@/lib/http/normalize-error';
import { newsFormSchema, type NewsFormValues } from './admin-news.schemas';
import { useAdminNews, useCreateNews, useNewsPublication, useUpdateNews } from './admin-news.queries.client';
import type { NewsPublicationInput, NewsWriteInput } from './admin-news.types';

const emptyValues: NewsFormValues = { title: '', slug: '', excerpt: '', content: '', status: 'DRAFT', publishedAt: '' };
const inputClass = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100';
const localTime = (iso: string | null) => iso ? new Date(iso).toLocaleString('sv-SE').slice(0, 16).replace(' ', 'T') : '';

function contentInput(values: NewsFormValues, coverKey: string | null | undefined): NewsWriteInput {
  return { title: values.title, slug: values.slug, excerpt: values.excerpt.trim() || null, content: values.content, coverKey };
}
function publicationInput(values: NewsFormValues): NewsPublicationInput {
  return values.status === 'PUBLISHED' && values.publishedAt
    ? { status: values.status, publishedAt: new Date(values.publishedAt).toISOString() }
    : { status: values.status };
}

export function AdminNewsForm({ newsId }: { newsId?: string }) {
  const router = useRouter();
  const detail = useAdminNews(newsId);
  const create = useCreateNews();
  const update = useUpdateNews();
  const publication = useNewsPublication();
  const [cover, setCover] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [uploading, setUploading] = useState(false);
  const form = useForm<NewsFormValues>({ resolver: zodResolver(newsFormSchema), defaultValues: emptyValues });
  const content = useWatch({ control: form.control, name: 'content' });
  const status = useWatch({ control: form.control, name: 'status' });

  useEffect(() => {
    if (!newsId || !detail.data) return;
    form.reset({ title: detail.data.title, slug: detail.data.slug, excerpt: detail.data.excerpt ?? '', content: detail.data.content ?? '', status: detail.data.status, publishedAt: localTime(detail.data.publishedAt) });
  }, [detail.data, form, newsId]);

  async function submit(values: NewsFormValues) {
    form.clearErrors('root');
    setUploading(Boolean(cover));
    try {
      const coverKey = cover ? (await uploadAdminImage(cover)).storageKey : removeCover ? null : detail.data?.coverKey;
      const saved = newsId
        ? await update.mutateAsync({ id: newsId, input: contentInput(values, coverKey) })
        : await create.mutateAsync(contentInput(values, coverKey));
      if (saved.status !== values.status || (values.status === 'PUBLISHED' && values.publishedAt)) {
        await publication.mutateAsync({ id: saved.id, input: publicationInput(values) });
      }
      if (!newsId) router.replace(`/admin/news/${saved.id}/edit`);
      setCover(null);
      setRemoveCover(false);
    } catch (error) {
      form.setError('root', { message: normalizeApiError(error).message });
    } finally { setUploading(false); }
  }

  if (newsId && detail.isPending) return <p aria-busy="true">Đang tải bài viết…</p>;
  if (detail.error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{normalizeApiError(detail.error).message}</p>;
  const busy = create.isPending || update.isPending || publication.isPending || uploading;

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
      {form.formState.errors.root?.message && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{form.formState.errors.root.message}</p>}
      <div className="grid gap-5 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm font-semibold md:col-span-2">Tiêu đề<input {...form.register('title')} className={inputClass} />{form.formState.errors.title && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.title.message}</span>}</label>
        <label className="text-sm font-semibold md:col-span-2">Slug<input {...form.register('slug')} className={inputClass} autoComplete="off" />{form.formState.errors.slug && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.slug.message}</span>}</label>
        <label className="text-sm font-semibold md:col-span-2">Tóm tắt và SEO description<textarea {...form.register('excerpt')} rows={3} className={inputClass} />{form.formState.errors.excerpt && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.excerpt.message}</span>}</label>
        <label className="text-sm font-semibold md:col-span-2">Nội dung Markdown<textarea {...form.register('content')} rows={16} className={`${inputClass} font-mono text-sm`} />{form.formState.errors.content && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.content.message}</span>}</label>
        {content && <details className="md:col-span-2"><summary className="cursor-pointer font-semibold">Xem trước Markdown an toàn</summary><div className="mt-3 rounded-xl border border-stone-200 p-4"><MarkdownPreview source={content} /></div></details>}
        <div className="space-y-3 md:col-span-2"><label className="block text-sm font-semibold">Ảnh bìa (PNG, JPEG hoặc WebP)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { setCover(event.target.files?.[0] ?? null); setRemoveCover(false); }} className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2`} /></label>{cover && <p className="text-sm text-stone-600">Ảnh mới: {cover.name}</p>}{detail.data?.coverKey && !cover && <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={removeCover} onChange={(event) => setRemoveCover(event.target.checked)} className="size-5 accent-red-600" />Xóa ảnh bìa hiện tại</label>}</div>
        <label className="text-sm font-semibold">Trạng thái<select {...form.register('status')} className={inputClass}><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Xuất bản</option><option value="ARCHIVED">Lưu trữ</option></select></label>
        {status === 'PUBLISHED' && <label className="text-sm font-semibold">Thời gian xuất bản<input type="datetime-local" {...form.register('publishedAt')} className={inputClass} /><span className="mt-1 block text-xs font-normal text-stone-500">Để trống để xuất bản ngay; chọn tương lai để lên lịch.</span>{form.formState.errors.publishedAt && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.publishedAt.message}</span>}</label>}
      </div>
      <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy} className="rounded-xl bg-orange-600 px-6 py-3 font-bold text-white disabled:opacity-60">{busy ? uploading ? 'Đang tải ảnh…' : 'Đang lưu…' : newsId ? 'Lưu bài viết' : 'Tạo bài viết'}</button><Link href="/admin/news" className="rounded-xl border border-stone-300 px-6 py-3 font-semibold text-stone-700 no-underline">Quay lại</Link></div>
    </form>
  );
}
