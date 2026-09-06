import Link from 'next/link';
import { pageMetadata } from '@/config/seo.server';
import { listPublicNews, NewsCard, newsOrigins } from '@/features/news/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = (await searchParams).page;
  const origins = newsOrigins();
  return pageMetadata({
    title: 'Tin tức',
    description: 'Tin tức và câu chuyện mới từ nhà sách.',
    path: '/news',
    noIndex: Boolean(page && page !== '1'),
    siteBase: origins.site,
    apiBase: origins.api,
  });
}

export default async function NewsList({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const raw = (await searchParams).page ?? '1';
  const page = /^[1-9][0-9]*$/.test(raw) ? Math.min(Number(raw), 10000) : 1;
  const data = await listPublicNews(page);
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-widest text-orange-700">Góc nhà sách</p>
      <h1 className="mt-2 text-4xl font-black">Tin tức</h1>
      {data.items.length ? <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{data.items.map((item) => <NewsCard key={item.id} item={item} />)}</div> : <p className="mt-8 rounded-2xl bg-white p-10 text-stone-600">Chưa có bài viết được xuất bản.</p>}
      <nav aria-label="Phân trang tin tức" className="mt-10 flex justify-center gap-3">
        {page > 1 && <Link href={'/news?page=' + (page - 1)} className="rounded-full border border-stone-300 px-5 py-2 no-underline">Trang trước</Link>}
        {data.hasMore && page < 10000 && <Link href={'/news?page=' + (page + 1)} className="rounded-full bg-stone-900 px-5 py-2 text-white no-underline">Trang sau</Link>}
      </nav>
    </section>
  );
}
