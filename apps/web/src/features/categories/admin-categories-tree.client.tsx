'use client';

import Link from 'next/link';
import { useState } from 'react';
import { normalizeApiError } from '@/lib/http/normalize-error';
import { useAdminCategoryTree, useDeleteCategory, useUpdateCategory } from './admin-categories.queries.client';
import type { AdminCategoryNode } from './admin-categories.types';

function flatten(nodes: AdminCategoryNode[], depth = 0): Array<AdminCategoryNode & { depth: number }> {
  return nodes.flatMap((node) => [{ ...node, depth }, ...flatten(node.children, depth + 1)]);
}

export function AdminCategoriesTree() {
  const tree = useAdminCategoryTree();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function toggle(category: AdminCategoryNode) {
    setUpdatingId(category.id);
    setActionError(null);
    try {
      await update.mutateAsync({
        id: category.id,
        input: { isActive: !category.isActive, sortOrder: category.sortOrder },
      });
    } catch (error) {
      setActionError(normalizeApiError(error).message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function destroy(category: AdminCategoryNode) {
    if (!window.confirm(`Xóa danh mục “${category.name}”?`)) return;
    setActionError(null);
    try { await remove.mutateAsync(category.id); }
    catch (error) { setActionError(normalizeApiError(error).message); }
  }

  const rows = tree.data ? flatten(tree.data as AdminCategoryNode[]) : [];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-orange-700">Catalog</p><h1 className="mt-1 text-3xl font-black">Danh mục</h1></div><Link href="/admin/categories/new" className="rounded-xl bg-orange-600 px-5 py-3 font-bold text-white no-underline">Thêm danh mục</Link></div>
      {actionError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{actionError}</p>}
      {tree.isPending ? <p aria-busy="true">Đang tải cây danh mục…</p> : tree.error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{normalizeApiError(tree.error).message}</p> : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500"><tr><th className="px-5 py-4">Danh mục</th><th className="px-5 py-4">Thứ tự</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-stone-100">{rows.map((category) => <tr key={category.id}><td className="px-5 py-4"><div style={{ paddingLeft: `${category.depth * 1.25}rem` }}><p className="font-bold">{category.depth > 0 && <span aria-hidden="true" className="mr-2 text-stone-400">↳</span>}{category.name}</p><p className="text-xs text-stone-500">{category.slug}</p></div></td><td className="px-5 py-4">{category.sortOrder}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${category.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>{category.isActive ? 'Hiển thị' : 'Đang ẩn'}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Link href={`/admin/categories/${category.id}/edit`} className="rounded-lg border border-stone-300 px-3 py-2 font-semibold no-underline">Sửa</Link><button type="button" disabled={updatingId !== null} onClick={() => void toggle(category)} className="rounded-lg border border-stone-300 px-3 py-2 font-semibold disabled:opacity-50">{category.isActive ? 'Ẩn' : 'Hiện'}</button><button type="button" disabled={remove.isPending} onClick={() => void destroy(category)} className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 disabled:opacity-50">Xóa</button></div></td></tr>)}</tbody></table>{rows.length === 0 && <p className="p-10 text-center text-stone-500">Chưa có danh mục.</p>}</div>
      )}
    </div>
  );
}
