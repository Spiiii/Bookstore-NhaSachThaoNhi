import Link from 'next/link';
import { listPublicBrands } from '@/features/brands/server';
import { listPublicProducts, ProductCard } from '@/features/catalog/server';
import { listPublicCategoryTree, type PublicCategory } from '@/features/categories/server';
import { pageMetadata } from '@/config/seo.server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
type Search = { page?: string; q?: string; categoryId?: string; brandId?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const noIndex = Boolean(search.q || search.categoryId || search.brandId || (search.page && search.page !== '1'));
  return pageMetadata({
    title: 'Sản phẩm',
    description: 'Khám phá sản phẩm đang được giới thiệu tại nhà sách.',
    path: '/products',
    noIndex,
  });
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function flatten(items: PublicCategory[], depth = 0): Array<PublicCategory & { depth: number }> {
  return items.flatMap((item) => [{ ...item, depth }, ...flatten(item.children, depth + 1)]);
}
function pageHref(search: Search, page: number) {
  const query = new URLSearchParams();
  Object.entries({ ...search, page: String(page) }).forEach(([key, value]) => { if (value) query.set(key, value); });
  return `/products?${query}`;
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const raw = await searchParams;
  const page = /^[1-9][0-9]*$/.test(raw.page ?? '') ? Math.min(Number(raw.page), 10000) : 1;
  const q = raw.q?.trim().slice(0, 100) || undefined;
  const categoryId = raw.categoryId && uuid.test(raw.categoryId) ? raw.categoryId : undefined;
  const brandId = raw.brandId && uuid.test(raw.brandId) ? raw.brandId : undefined;
  const [products, tree, brands] = await Promise.all([
    listPublicProducts({ page, q, categoryId, brandId }), listPublicCategoryTree(), listPublicBrands(),
  ]);
  const categories = flatten(tree);
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-widest text-orange-700">Catalogue</p><h1 className="mt-2 text-4xl font-black">Sản phẩm</h1>
      <form action="/products" className="mt-8 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 md:grid-cols-[1fr_220px_220px_auto]">
        <label className="sr-only" htmlFor="q">Tìm sản phẩm</label><input id="q" name="q" defaultValue={q} maxLength={100} placeholder="Tên hoặc mã sản phẩm" className="rounded-xl border border-stone-300 px-4 py-3" />
        <label className="sr-only" htmlFor="categoryId">Danh mục</label><select id="categoryId" name="categoryId" defaultValue={categoryId ?? ''} className="rounded-xl border border-stone-300 px-4 py-3"><option value="">Tất cả danh mục</option>{categories.map((item) => <option key={item.id} value={item.id}>{'— '.repeat(item.depth)}{item.name}</option>)}</select>
        <label className="sr-only" htmlFor="brandId">Thương hiệu</label><select id="brandId" name="brandId" defaultValue={brandId ?? ''} className="rounded-xl border border-stone-300 px-4 py-3"><option value="">Tất cả thương hiệu</option>{brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <button className="rounded-xl bg-stone-900 px-6 py-3 font-bold text-white">Tìm kiếm</button>
      </form>
      {products.items.length ? <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{products.items.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="mt-8 rounded-2xl bg-white p-10 text-center text-stone-600">Không tìm thấy sản phẩm phù hợp.</div>}
      <nav aria-label="Phân trang sản phẩm" className="mt-10 flex justify-center gap-3">{page > 1 && <Link href={pageHref(raw, page - 1)} className="rounded-full border border-stone-300 px-5 py-2 no-underline">Trang trước</Link>}{products.hasMore && page < 10000 && <Link href={pageHref(raw, page + 1)} className="rounded-full bg-stone-900 px-5 py-2 text-white no-underline">Trang sau</Link>}</nav>
    </section>
  );
}
