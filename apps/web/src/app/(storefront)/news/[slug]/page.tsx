import type { Metadata } from 'next';
import Image from 'next/image';
import { MarkdownView } from '@/components/content/markdown-view';
import { getPublicNews, newsMetadata, newsOrigins } from '@/features/news/server';
import { publicMediaUrl } from '@/lib/http/public-api.server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return newsMetadata(await getPublicNews((await params).slug), newsOrigins());
}

export default async function NewsPage({ params }: Props) {
  const item = await getPublicNews((await params).slug);
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-widest text-orange-700">Góc Thảo Nhi</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{item.title}</h1>
      <time className="mt-4 block text-sm text-stone-500" dateTime={item.publishedAt}>
        {new Date(item.publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' })}
      </time>
      {item.excerpt && <p className="mt-6 text-xl leading-8 text-stone-600">{item.excerpt}</p>}
      {item.coverUrl && <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl"><Image src={publicMediaUrl(item.coverUrl)!} alt="" fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" unoptimized /></div>}
      <div className="mt-10"><MarkdownView source={item.content ?? ''} /></div>
    </article>
  );
}
