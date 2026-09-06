'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { normalizeApiError } from '@/lib/http/normalize-error';
import { useAdminBanners, useDeleteBanner, useUpdateBanner } from './admin-banners.queries.client';
import type { AdminBanner } from './admin-banners.types';

function pageHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.set('page', String(page));
  return `/admin/banners?${next}`;
}
function scheduleLabel(banner: AdminBanner) {
  if (!banner.isActive) return 'Đang tắt';
  const now = Date.now();
  if (banner.startAt && new Date(banner.startAt).getTime() > now) return 'Đã lên lịch';
  if (banner.endAt && new Date(banner.endAt).getTime() <= now) return 'Đã hết hạn';
  return 'Đang hiển thị';
}

export function AdminBannersTable() {
  const search = useSearchParams();
  const router = useRouter();
  const rawPage = search.get('page') ?? '1';
  const page = /^[1-9][0-9]*$/.test(rawPage) ? Math.min(Number(rawPage), 10_000) : 1;
  const q = search.get('q')?.trim().slice(0, 100) || undefined;
  const placement = search.get('placement')?.trim().slice(0, 64) || undefined;
  const status = search.get('status');
  const isActive = status === 'active' ? true : status === 'inactive' ? false : undefined;
  const banners = useAdminBanners({ page, q, placement, isActive });
  const update = useUpdateBanner();
  const remove = useDeleteBanner();
  const [actionError, setActionError] = useState<string | null>(null);

  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of ['q', 'placement', 'status']) {
      const value = String(data.get(key) ?? '').trim();
      if (value) next.set(key, value);
    }
    router.push(`/admin/banners${next.size ? `?${next}` : ''}`);
  }
  async function toggle(banner: AdminBanner) {
    setActionError(null);
    try { await update.mutateAsync({ id: banner.id, input: { isActive: !banner.isActive, sortOrder: banner.sortOrder } }); }
    catch (error) { setActionError(normalizeApiError(error).message); }
  }
  async function destroy(banner: AdminBanner) {
    if (!window.confirm(`Xóa banner “${banner.title}”? Thao tác này không thể hoàn tác.`)) return;
    setActionError(null);
    try { await remove.mutateAsync(banner.id); }
    catch (error) { setActionError(normalizeApiError(error).message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-orange-700">Nội dung</p><h1 className="mt-1 text-3xl font-black">Banners</h1></div><Link href="/admin/banners/new" className="rounded-xl bg-orange-600 px-5 py-3 font-bold text-white no-underline">Thêm banner</Link></div>
      <form onSubmit={filter} className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm lg:grid-cols-[1fr_180px_180px_auto]"><label className="sr-only" htmlFor="banner-q">Tìm banner</label><input id="banner-q" name="q" defaultValue={q} maxLength={100} placeholder="Tên nội bộ…" className="rounded-xl border border-stone-300 px-4 py-2.5" /><label className="sr-only" htmlFor="banner-placement">Placement</label><input id="banner-placement" name="placement" defaultValue={placement} maxLength={64} placeholder="home-hero" className="rounded-xl border border-stone-300 px-4 py-2.5" /><label className="sr-only" htmlFor="banner-status">Trạng thái</label><select id="banner-status" name="status" defaultValue={status ?? ''} className="rounded-xl border border-stone-300 px-4 py-2.5"><option value="">Tất cả</option><option value="active">Đang bật</option><option value="inactive">Đang tắt</option></select><button className="rounded-xl bg-stone-900 px-5 py-2.5 font-semibold text-white">Lọc</button></form>
      {actionError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{actionError}</p>}
      {banners.isPending ? <p aria-busy="true">Đang tải banners…</p> : banners.error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{normalizeApiError(banners.error).message}</p> : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="w-full min-w-[940px] text-left text-sm"><thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500"><tr><th className="px-5 py-4">Banner</th><th className="px-5 py-4">Placement</th><th className="px-5 py-4">Thứ tự</th><th className="px-5 py-4">Lịch hiển thị</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-stone-100">{banners.data?.items.map((banner) => <tr key={banner.id}><td className="px-5 py-4"><p className="font-bold">{banner.title}</p><p className="max-w-sm truncate text-xs text-stone-500">{banner.targetUrl || 'Không có liên kết đích'}</p></td><td className="px-5 py-4 font-mono text-xs">{banner.placement}</td><td className="px-5 py-4">{banner.sortOrder}</td><td className="px-5 py-4"><p className="font-semibold">{scheduleLabel(banner)}</p><p className="text-xs text-stone-500">{banner.startAt ? new Date(banner.startAt).toLocaleString('vi-VN') : 'Không giới hạn đầu'} → {banner.endAt ? new Date(banner.endAt).toLocaleString('vi-VN') : 'Không giới hạn cuối'}</p></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Link href={`/admin/banners/${banner.id}/edit`} className="rounded-lg border border-stone-300 px-3 py-2 font-semibold no-underline">Sửa</Link><button type="button" disabled={update.isPending} onClick={() => void toggle(banner)} className="rounded-lg border border-stone-300 px-3 py-2 font-semibold disabled:opacity-50">{banner.isActive ? 'Tắt' : 'Bật'}</button><button type="button" disabled={remove.isPending} onClick={() => void destroy(banner)} className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 disabled:opacity-50">Xóa</button></div></td></tr>)}</tbody></table>{banners.data?.items.length === 0 && <p className="p-10 text-center text-stone-500">Không có banner phù hợp.</p>}</div>
      )}
      {banners.data && <nav aria-label="Phân trang banner quản trị" className="flex justify-center gap-3">{page > 1 && <Link href={pageHref(new URLSearchParams(search), page - 1)} className="rounded-xl border border-stone-300 px-4 py-2 no-underline">Trang trước</Link>}<span className="px-4 py-2 text-sm text-stone-600">Trang {page}</span>{banners.data.hasMore && <Link href={pageHref(new URLSearchParams(search), page + 1)} className="rounded-xl bg-stone-900 px-4 py-2 text-white no-underline">Trang sau</Link>}</nav>}
    </div>
  );
}
