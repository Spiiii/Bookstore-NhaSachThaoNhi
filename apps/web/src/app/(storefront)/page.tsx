import Image from 'next/image';
import Link from 'next/link';
import { listHomeBanners } from '@/features/banners/server';
import { listPublicProducts, ProductCard } from '@/features/catalog/server';
import { listPublicNews, NewsCard } from '@/features/news/server';
import { publicMediaUrl } from '@/lib/http/public-api.server';
import { pageMetadata } from '@/config/seo.server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function generateMetadata() {
  return pageMetadata({ path: '/', absoluteTitle: true });
}

export default async function HomePage() {
  const [banners, products, news] = await Promise.all([
    listHomeBanners(), listPublicProducts(), listPublicNews(1),
  ]);
  const hero = banners[0];

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        {hero ? (
          <div className="relative overflow-hidden rounded-[2rem] bg-stone-900 shadow-xl">
            <Image src={publicMediaUrl(hero.imageUrl)!} alt={hero.altText} width={1440} height={640} priority unoptimized className="aspect-[16/7] w-full object-cover" />
            {hero.targetUrl && <a href={hero.targetUrl} aria-label={hero.altText || 'Xem nội dung nổi bật'} className="absolute inset-0 no-underline"><span className="sr-only">Xem nội dung nổi bật</span></a>}
          </div>
        ) : (
          <div className="rounded-[2rem] bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 px-8 py-20 sm:px-16">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-700">Khám phá mỗi ngày</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">Những cuốn sách dành cho hành trình của bạn</h1>
            <p className="mt-5 max-w-xl text-lg text-stone-600">Xem thông tin sản phẩm, ghé cửa hàng hoặc chuyển đến marketplace khi bạn đã chọn được cuốn sách phù hợp.</p>
            <Link href="/products" className="mt-8 inline-flex rounded-full bg-stone-900 px-6 py-3 font-bold text-white no-underline">Xem sản phẩm</Link>
          </div>
        )}
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-orange-700">Danh mục nổi bật</p><h2 className="mt-2 text-3xl font-black">Sản phẩm mới</h2></div><Link href="/products" className="font-semibold text-orange-700">Xem tất cả</Link></div>
        {products.items.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{products.items.slice(0, 6).map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="rounded-2xl bg-white p-8 text-stone-600">Sản phẩm đang được cập nhật.</p>}
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-orange-700">Góc Thảo Nhi</p><h2 className="mt-2 text-3xl font-black">Tin mới</h2></div><Link href="/news" className="font-semibold text-orange-700">Xem tất cả</Link></div>
        {news.items.length ? <div className="grid gap-6 md:grid-cols-3">{news.items.slice(0, 3).map((item) => <NewsCard key={item.id} item={item} />)}</div> : <p className="rounded-2xl bg-white p-8 text-stone-600">Chưa có bài viết mới.</p>}
      </section>
    </>
  );
}
