'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { normalizeApiError } from '@/lib/http/normalize-error';
import { formatVnd } from './product-format';
import { useAdminProducts, useDeleteProduct, usePublishProduct } from './admin-products.queries.client';

function href(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.set('page', String(page));
  return `/admin/products?${next}`;
}

export function AdminProductsTable() {
  const search = useSearchParams();
  const router = useRouter();
  const rawPage = search.get('page') ?? '1';
  const page = /^[1-9][0-9]*$/.test(rawPage) ? Math.min(Number(rawPage), 10_000) : 1;
  const q = search.get('q')?.trim().slice(0, 100) || undefined;
  const status = search.get('status');
  const isActive = status === 'active' ? true : status === 'inactive' ? false : undefined;
  const products = useAdminProducts({ page, q, isActive });
  const publish = usePublishProduct();
  const remove = useDeleteProduct();
  const [actionError, setActionError] = useState<string | null>(null);

  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    const query = String(data.get('q') ?? '').trim();
    const nextStatus = String(data.get('status') ?? '');
    if (query) next.set('q', query);
    if (nextStatus) next.set('status', nextStatus);
    router.push(`/admin/products${next.size ? `?${next}` : ''}`);
  }

  async function toggle(id: string, active: boolean) {
    setActionError(null);
    try { await publish.mutateAsync({ id, isActive: active }); }
    catch (error) { setActionError(normalizeApiError(error).message); }
  }
  async function destroy(id: string, name: string) {
    if (!window.confirm(`Xóa sản phẩm “${name}”? Thao tác này không thể hoàn tác.`)) return;
    setActionError(null);
    try { await remove.mutateAsync(id); }
    catch (error) { setActionError(normalizeApiError(error).message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-orange-700">Catalog</p><h1 className="mt-1 text-3xl font-black">Sản phẩm</h1></div><Link href="/admin/products/new" className="rounded-xl bg-orange-600 px-5 py-3 font-bold text-white no-underline">Thêm sản phẩm</Link></div>
      <form onSubmit={filter} className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-[1fr_180px_auto]"><label className="sr-only" htmlFor="product-q">Tìm sản phẩm</label><input id="product-q" name="q" defaultValue={q} maxLength={100} placeholder="Tên, SKU…" className="rounded-xl border border-stone-300 px-4 py-2.5" /><label className="sr-only" htmlFor="product-status">Trạng thái</label><select id="product-status" name="status" defaultValue={status ?? ''} className="rounded-xl border border-stone-300 px-4 py-2.5"><option value="">Tất cả</option><option value="active">Đang công khai</option><option value="inactive">Đang ẩn</option></select><button className="rounded-xl bg-stone-900 px-5 py-2.5 font-semibold text-white">Lọc</button></form>
      {actionError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{actionError}</p>}
      {products.isPending ? <p aria-busy="true">Đang tải sản phẩm…</p> : products.error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{normalizeApiError(products.error).message}</p> : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500"><tr><th className="px-5 py-4">Sản phẩm</th><th className="px-5 py-4">Giá</th><th className="px-5 py-4">Ảnh</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-stone-100">{products.data?.items.map((product) => <tr key={product.id}><td className="px-5 py-4"><p className="font-bold">{product.name}</p><p className="text-xs text-stone-500">{product.sku} · {product.slug}</p></td><td className="px-5 py-4">{formatVnd(product.referencePrice)}</td><td className="px-5 py-4">{product.images.length}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${product.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>{product.isActive ? 'Công khai' : 'Đang ẩn'}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Link href={`/admin/products/${product.id}/edit`} className="rounded-lg border border-stone-300 px-3 py-2 font-semibold no-underline">Sửa</Link><button type="button" disabled={publish.isPending} onClick={() => void toggle(product.id, !product.isActive)} className="rounded-lg border border-stone-300 px-3 py-2 font-semibold disabled:opacity-50">{product.isActive ? 'Ẩn' : 'Công khai'}</button><button type="button" disabled={remove.isPending} onClick={() => void destroy(product.id, product.name)} className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 disabled:opacity-50">Xóa</button></div></td></tr>)}</tbody></table>{products.data?.items.length === 0 && <p className="p-10 text-center text-stone-500">Không có sản phẩm phù hợp.</p>}</div>
      )}
      {products.data && <nav aria-label="Phân trang sản phẩm quản trị" className="flex justify-center gap-3">{page > 1 && <Link href={href(new URLSearchParams(search), page - 1)} className="rounded-xl border border-stone-300 px-4 py-2 no-underline">Trang trước</Link>}<span className="px-4 py-2 text-sm text-stone-600">Trang {page}</span>{products.data.hasMore && <Link href={href(new URLSearchParams(search), page + 1)} className="rounded-xl bg-stone-900 px-4 py-2 text-white no-underline">Trang sau</Link>}</nav>}
    </div>
  );
}
