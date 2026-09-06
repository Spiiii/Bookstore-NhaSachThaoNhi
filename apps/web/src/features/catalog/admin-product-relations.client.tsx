'use client';

import { useState, type FormEvent } from 'react';
import { uploadAdminImage } from '@/features/uploads/client';
import { normalizeApiError } from '@/lib/http/normalize-error';
import { useAdminProduct, useProductRelationMutation } from './admin-products.queries.client';
import type { Marketplace } from './admin-products.types';

const inputClass = 'rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none focus:border-orange-600';

export function AdminProductRelations({ productId }: { productId: string }) {
  const product = useAdminProduct(productId);
  const mutations = useProductRelationMutation(productId);
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function action(work: () => Promise<unknown>) {
    setError(null);
    try { await work(); }
    catch (cause) { setError(normalizeApiError(cause).message); }
  }
  async function addImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!image) { setError('Vui lòng chọn ảnh sản phẩm.'); return; }
    const form = event.currentTarget;
    const data = new FormData(form);
    await action(async () => {
      const uploaded = await uploadAdminImage(image);
      await mutations.attachImage.mutateAsync({ storageKey: uploaded.storageKey, altText: String(data.get('altText') ?? '').trim() || null, sortOrder: Number(data.get('sortOrder')), isPrimary: data.get('isPrimary') === 'on' });
      setImage(null);
      form.reset();
    });
  }
  async function updateImage(event: FormEvent<HTMLFormElement>, imageId: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await action(() => mutations.updateImage.mutateAsync({ childId: imageId, input: { altText: String(data.get('altText') ?? '').trim() || null, sortOrder: Number(data.get('sortOrder')), isPrimary: data.get('isPrimary') === 'on' } }));
  }
  async function addAttribute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await action(async () => {
      await mutations.addAttribute.mutateAsync({ key: String(data.get('key')), label: String(data.get('label')), value: String(data.get('value')), sortOrder: Number(data.get('sortOrder')) });
      form.reset();
    });
  }
  async function updateAttribute(event: FormEvent<HTMLFormElement>, attributeId: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await action(() => mutations.updateAttribute.mutateAsync({ childId: attributeId, input: { key: String(data.get('key')), label: String(data.get('label')), value: String(data.get('value')), sortOrder: Number(data.get('sortOrder')) } }));
  }
  async function setMarketplace(event: FormEvent<HTMLFormElement>, marketplace: Marketplace) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await action(() => mutations.setMarketplace.mutateAsync({ marketplace, input: { url: String(data.get('url')), isActive: data.get('isActive') === 'on' } }));
  }

  if (product.isPending) return <p aria-busy="true">Đang tải dữ liệu mở rộng…</p>;
  if (product.error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{normalizeApiError(product.error).message}</p>;
  if (!product.data) return null;
  const busy = Object.values(mutations).some((mutation) => mutation.isPending);

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div><h2 className="text-xl font-black">Ảnh sản phẩm</h2><p className="text-sm text-stone-600">Sản phẩm phải có ít nhất một ảnh trước khi công khai.</p></div>
        {product.data.images.map((item) => <form key={item.id} onSubmit={(event) => void updateImage(event, item.id)} className="grid gap-3 rounded-xl border border-stone-200 p-4 md:grid-cols-[1fr_110px_auto_auto]"><input name="altText" defaultValue={item.altText ?? ''} maxLength={250} placeholder="Alt text" className={inputClass} /><input name="sortOrder" defaultValue={item.sortOrder} type="number" min={0} className={inputClass} /><label className="flex items-center gap-2 text-sm"><input name="isPrimary" type="checkbox" defaultChecked={item.isPrimary} />Ảnh chính</label><div className="flex gap-2"><button disabled={busy} className="rounded-lg bg-stone-900 px-3 py-2 font-semibold text-white disabled:opacity-50">Lưu</button><button type="button" disabled={busy} onClick={() => void action(() => mutations.removeImage.mutateAsync(item.id))} className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 disabled:opacity-50">Xóa</button></div></form>)}
        <form onSubmit={(event) => void addImage(event)} className="grid gap-3 rounded-xl bg-stone-50 p-4 md:grid-cols-2"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} className={`${inputClass} md:col-span-2`} /><input name="altText" maxLength={250} placeholder="Alt text" className={inputClass} /><input name="sortOrder" type="number" min={0} defaultValue={product.data.images.length} className={inputClass} /><label className="flex items-center gap-2 text-sm"><input name="isPrimary" type="checkbox" />Đặt làm ảnh chính</label><button disabled={busy} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50">Tải và thêm ảnh</button></form>
      </section>
      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Thuộc tính</h2>
        {product.data.attributes?.map((item) => <form key={item.id} onSubmit={(event) => void updateAttribute(event, item.id)} className="grid gap-3 rounded-xl border border-stone-200 p-4 lg:grid-cols-[160px_1fr_1fr_100px_auto]"><input name="key" required defaultValue={item.key} maxLength={80} className={inputClass} /><input name="label" required defaultValue={item.label} maxLength={120} className={inputClass} /><input name="value" required defaultValue={item.value} maxLength={1000} className={inputClass} /><input name="sortOrder" type="number" min={0} defaultValue={item.sortOrder} className={inputClass} /><div className="flex gap-2"><button disabled={busy} className="rounded-lg bg-stone-900 px-3 py-2 font-semibold text-white disabled:opacity-50">Lưu</button><button type="button" disabled={busy} onClick={() => void action(() => mutations.removeAttribute.mutateAsync(item.id))} className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 disabled:opacity-50">Xóa</button></div></form>)}
        <form onSubmit={(event) => void addAttribute(event)} className="grid gap-3 rounded-xl bg-stone-50 p-4 lg:grid-cols-[160px_1fr_1fr_100px_auto]"><input name="key" required pattern="[a-z0-9][a-z0-9_-]*" maxLength={80} placeholder="key" className={inputClass} /><input name="label" required maxLength={120} placeholder="Nhãn" className={inputClass} /><input name="value" required maxLength={1000} placeholder="Giá trị" className={inputClass} /><input name="sortOrder" type="number" min={0} defaultValue={0} className={inputClass} /><button disabled={busy} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50">Thêm</button></form>
      </section>
      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div><h2 className="text-xl font-black">Liên kết marketplace</h2><p className="text-sm text-stone-600">Để trống bằng cách xóa liên kết; storefront sẽ hiển thị “Chưa có liên kết”.</p></div>
        {(['SHOPEE', 'TIKTOK_SHOP'] as const).map((marketplace) => { const current = product.data.marketplaceLinks?.find((item) => item.marketplace === marketplace); return <form key={marketplace} onSubmit={(event) => void setMarketplace(event, marketplace)} className="grid gap-3 rounded-xl border border-stone-200 p-4 md:grid-cols-[150px_1fr_auto_auto]"><strong className="self-center">{marketplace === 'SHOPEE' ? 'Shopee' : 'TikTok Shop'}</strong><input name="url" type="url" required maxLength={2048} defaultValue={current?.url ?? ''} placeholder="https://…" className={inputClass} /><label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={current?.isActive ?? true} />Hoạt động</label><div className="flex gap-2"><button disabled={busy} className="rounded-lg bg-stone-900 px-3 py-2 font-semibold text-white disabled:opacity-50">Lưu</button>{current && <button type="button" disabled={busy} onClick={() => void action(() => mutations.removeMarketplace.mutateAsync(marketplace))} className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 disabled:opacity-50">Xóa</button>}</div></form>; })}
      </section>
    </div>
  );
}
