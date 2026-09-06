import Image from 'next/image';
import Link from 'next/link';
import { publicMediaUrl } from '@/lib/http/public-api.server';
import type { PublicNews } from './server';

export function NewsCard({ item }: { item: PublicNews }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
      {item.coverUrl && <div className="relative aspect-[16/9]"><Image src={publicMediaUrl(item.coverUrl)!} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" unoptimized /></div>}
      <div className="p-5">
        <time className="text-xs font-semibold uppercase tracking-wider text-orange-700" dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</time>
        <h2 className="mt-2 text-xl font-bold"><Link href={`/news/${item.slug}`} className="text-stone-900 no-underline hover:text-orange-700">{item.title}</Link></h2>
        {item.excerpt && <p className="mt-2 text-sm text-stone-600">{item.excerpt}</p>}
      </div>
    </article>
  );
}
