'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { normalizeApiError } from '@/lib/http/normalize-error';
import { useAdminNewsList, useDeleteNews, useNewsPublication } from './admin-news.queries.client';
import type { NewsStatus } from './admin-news.types';

const statusLabel: Record<NewsStatus, string> = { DRAFT: 'Bản nháp', PUBLISHED: 'Đã xuất bản', ARCHIVED: 'Lưu trữ' };
const statusClass: Record<NewsStatus, string> = { DRAFT: 'bg-amber-100 text-amber-800', PUBLISHED: 'bg-emerald-100 text-emerald-700', ARCHIVED: 'bg-stone-100 text-stone-600' };

function pageHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.set('page', String(page));
  return `/admin/news?${next}`;
}

export function AdminNewsTable() {
  const search = useSearchParams();
  const router = useRouter();
  const rawPage = search.get('page') ?? '1';
  const page = /^[1-9][0-9]*$/.test(rawPage) ? Math.min(Number(rawPage), 10_000) : 1;
  const q = search.get('q')?.trim().slice(0, 100) || undefined;
  const rawStatus = search.get('status');
  const status = rawStatus === 'DRAFT' || rawStatus === 'PUBLISHED' || rawStatus === 'ARCHIVED' ? rawStatus : undefined;
  const news = useAdminNewsList({ page, q, status });
  const publication = useNewsPublication();
  const remove = useDeleteNews();
  const [actionError, setActionError] = useState<string | null>(null);

  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    const query = String(data.get('q') ?? '').trim();
    const nextStatus = String(data.get('status') ?? '');
    if (query) next.set('q', query);
    if (nextStatus) next.set('status', nextStatus);
    router.push(`/admin/news${next.size ? `?${next}` : ''}`);
  }
  async function changeStatus(id: string, nextStatus: NewsStatus) {
    setActionError(null);
    try { await publication.mutateAsync({ id, input: { status: nextStatus } }); }
    catch (error) { setActionError(normalizeApiError(error).message); }
  }
  async function destroy(id: string, title: string) {
    if (!window.confirm(`Xóa bài viết “${title}”? Thao tác này không thể hoàn tác.`)) return;
    setActionError(null);
    try { await remove.mutateAsync(id); }
    catch (error) { setActionError(normalizeApiError(error).message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-orange-700">Nội dung</p><h1 className="mt-1 text-3xl font-black">Tin tức</h1></div><Link href="/admin/news/new" className="rounded-xl bg-orange-600 px-5 py-3 font-bold text-white no-underline">Thêm bài viết</Link></div>
      <form onSubmit={filter} className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-[1fr_180px_auto]"><label className="sr-only" htmlFor="news-q">Tìm bài viết</label><input id="news-q" name="q" defaultValue={q} maxLength={100} placeholder="Tiêu đề…" className="rounded-xl border border-stone-300 px-4 py-2.5" /><label className="sr-only" htmlFor="news-status">Trạng thái</label><select id="news-status" name="status" defaultValue={status ?? ''} className="rounded-xl border border-stone-300 px-4 py-2.5"><option value="">Tất cả</option><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Đã xuất bản</option><option value="ARCHIVED">Lưu trữ</option></select><button className="rounded-xl bg-stone-900 px-5 py-2.5 font-semibold text-white">Lọc</button></form>
      {actionError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{actionError}</p>}
      {news.isPending ? <p aria-busy="true">Đang tải bài viết…</p> : news.error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{normalizeApiError(news.error).message}</p> : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="w-full min-w-[920px] text-left text-sm"><thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500"><tr><th className="px-5 py-4">Bài viết</th><th className="px-5 py-4">Xuất bản</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-stone-100">{news.data?.items.map((item) => <tr key={item.id}><td className="px-5 py-4"><p className="font-bold">{item.title}</p><p className="text-xs text-stone-500">{item.slug}{item.coverKey ? ' · Có ảnh bìa' : ''}</p></td><td className="px-5 py-4">{item.publishedAt ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.publishedAt)) : <span className="text-stone-400">Chưa đặt</span>}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[item.status]}`}>{statusLabel[item.status]}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Link href={`/admin/news/${item.id}/edit`} className="rounded-lg border border-stone-300 px-3 py-2 font-semibold no-underline">Sửa</Link>{item.status !== 'PUBLISHED' && <button type="button" disabled={publication.isPending} onClick={() => void changeStatus(item.id, 'PUBLISHED')} className="rounded-lg border border-emerald-200 px-3 py-2 font-semibold text-emerald-700 disabled:opacity-50">Xuất bản</button>}{item.status === 'PUBLISHED' && <button type="button" disabled={publication.isPending} onClick={() => void changeStatus(item.id, 'ARCHIVED')} className="rounded-lg border border-stone-300 px-3 py-2 font-semibold disabled:opacity-50">Lưu trữ</button>}<button type="button" disabled={remove.isPending} onClick={() => void destroy(item.id, item.title)} className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 disabled:opacity-50">Xóa</button></div></td></tr>)}</tbody></table>{news.data?.items.length === 0 && <p className="p-10 text-center text-stone-500">Không có bài viết phù hợp.</p>}</div>
      )}
      {news.data && <nav aria-label="Phân trang tin tức quản trị" className="flex justify-center gap-3">{page > 1 && <Link href={pageHref(new URLSearchParams(search), page - 1)} className="rounded-xl border border-stone-300 px-4 py-2 no-underline">Trang trước</Link>}<span className="px-4 py-2 text-sm text-stone-600">Trang {page}</span>{news.data.hasMore && <Link href={pageHref(new URLSearchParams(search), page + 1)} className="rounded-xl bg-stone-900 px-4 py-2 text-white no-underline">Trang sau</Link>}</nav>}
    </div>
  );
}
