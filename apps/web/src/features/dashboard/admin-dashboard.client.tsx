'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { normalizeApiError } from '@/lib/http/normalize-error';
import { PRIVATE_QUERY_META } from '@/lib/query/query-client';
import { getAdminDashboard } from './admin-dashboard.api.client';

const cards = [
  { key: 'products', label: 'Sản phẩm', href: '/admin/products', accent: 'bg-orange-100 text-orange-700' },
  { key: 'categories', label: 'Danh mục', href: '/admin/categories', accent: 'bg-sky-100 text-sky-700' },
  { key: 'brands', label: 'Thương hiệu', href: '/admin/brands', accent: 'bg-violet-100 text-violet-700' },
  { key: 'news', label: 'Tin tức', href: '/admin/news', accent: 'bg-emerald-100 text-emerald-700' },
  { key: 'banners', label: 'Banner', href: '/admin/banners', accent: 'bg-rose-100 text-rose-700' },
] as const;

export function AdminDashboard() {
  const dashboard = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: getAdminDashboard,
    meta: PRIVATE_QUERY_META,
  });

  if (dashboard.isPending) {
    return <p aria-busy="true" className="rounded-2xl bg-white p-8 text-stone-600 shadow-sm">Đang tổng hợp dữ liệu quản trị…</p>;
  }
  if (dashboard.error) {
    return <p role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">Không thể tải tổng quan: {normalizeApiError(dashboard.error).message}</p>;
  }

  const data = dashboard.data;
  const hiddenProducts = data.products.total - data.products.active;
  const unpublishedNews = data.news.total - data.news.published;
  const alerts = [
    data.products.missingImages > 0 ? { label: `${data.products.missingImages} sản phẩm chưa có ảnh`, href: '/admin/products' } : null,
    hiddenProducts > 0 ? { label: `${hiddenProducts} sản phẩm đang ẩn`, href: '/admin/products?status=inactive' } : null,
    data.news.draft > 0 ? { label: `${data.news.draft} bài viết đang ở bản nháp`, href: '/admin/news?status=DRAFT' } : null,
    unpublishedNews === 0 ? null : { label: `${unpublishedNews} bài viết chưa được công khai`, href: '/admin/news' },
  ].filter((item): item is { label: string; href: string } => item !== null);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold uppercase tracking-widest text-orange-700">Trung tâm quản trị</p><h1 className="mt-1 text-3xl font-black">Tổng quan</h1><p className="mt-2 text-stone-600">Theo dõi nhanh tình trạng nội dung đang phục vụ khách hàng.</p></div>
        <Link href="/admin/products/new" className="rounded-xl bg-orange-600 px-5 py-3 font-bold text-white no-underline shadow-sm">Thêm sản phẩm</Link>
      </div>

      <section aria-label="Số liệu nội dung" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const section = data[card.key];
          const active = card.key === 'news' ? data.news.published : data[card.key].active;
          return <Link key={card.key} href={card.href} className="rounded-2xl bg-white p-5 text-stone-900 no-underline shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${card.accent}`}>{card.label}</span><p className="mt-4 text-4xl font-black">{section.total}</p><p className="mt-1 text-sm text-stone-500">{active} đang hiển thị</p></Link>;
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wider text-stone-500">Cần chú ý</p><h2 className="mt-1 text-xl font-black">Việc nên xử lý tiếp theo</h2></div><span className={`rounded-full px-3 py-1 text-sm font-bold ${alerts.length ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>{alerts.length ? `${alerts.length} mục` : 'Ổn định'}</span></div>
          {alerts.length ? <ul className="mt-5 divide-y divide-stone-100">{alerts.map((alert) => <li key={alert.label} className="flex items-center justify-between gap-4 py-4"><span className="text-stone-700">{alert.label}</span><Link href={alert.href} className="font-bold text-orange-700 no-underline">Xem →</Link></li>)}</ul> : <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-800">Nội dung chính đang ở trạng thái tốt. Không có cảnh báo cần xử lý ngay.</p>}
        </section>

        <section className="rounded-2xl bg-stone-950 p-6 text-white shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wider text-orange-400">Xuất bản</p><h2 className="mt-1 text-xl font-black">Tình trạng nội dung</h2>
          <dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-stone-400">Sản phẩm công khai</dt><dd className="font-bold">{data.products.active}/{data.products.total}</dd></div><div className="flex justify-between gap-4"><dt className="text-stone-400">Tin đã xuất bản</dt><dd className="font-bold">{data.news.published}/{data.news.total}</dd></div><div className="flex justify-between gap-4"><dt className="text-stone-400">Banner đang bật</dt><dd className="font-bold">{data.banners.active}/{data.banners.total}</dd></div><div className="flex justify-between gap-4"><dt className="text-stone-400">Thương hiệu hiển thị</dt><dd className="font-bold">{data.brands.active}/{data.brands.total}</dd></div></dl>
          <p className="mt-6 border-t border-stone-800 pt-4 text-xs text-stone-500">Cập nhật lúc {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(data.generatedAt))}</p>
        </section>
      </div>
    </div>
  );
}
