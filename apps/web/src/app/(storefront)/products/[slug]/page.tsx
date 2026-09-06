import type { Metadata } from 'next';
import Image from 'next/image';
import { MarkdownView } from '@/components/content/markdown-view';
import { formatVnd, getPublicProduct, MarketplaceActions } from '@/features/catalog/server';
import { publicMediaUrl } from '@/lib/http/public-api.server';
import { pageMetadata } from '@/config/seo.server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getPublicProduct((await params).slug);
  const primary = product.images.find((image) => image.isPrimary) ?? product.images[0];
  return pageMetadata({
    title: product.name,
    description: product.summary,
    path: `/products/${product.slug}`,
    imagePath: primary?.url,
  });
}
export default async function ProductDetailPage({ params }: Props) {
  const product = await getPublicProduct((await params).slug);
  const primary = product.images.find((image) => image.isPrimary) ?? product.images[0];
  return (
    <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div><div className="relative aspect-square overflow-hidden rounded-3xl bg-amber-50">{primary ? <Image src={publicMediaUrl(primary.url)!} alt={primary.altText ?? product.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-5" unoptimized /> : <div className="flex h-full items-center justify-center text-stone-500">Chưa có ảnh</div>}</div>{product.images.length > 1 && <div className="mt-4 grid grid-cols-4 gap-3">{product.images.map((image) => <div key={image.id} className="relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-white"><Image src={publicMediaUrl(image.url)!} alt={image.altText ?? product.name} fill sizes="120px" className="object-cover" unoptimized /></div>)}</div>}</div>
        <div><p className="text-sm font-bold uppercase tracking-widest text-orange-700">{product.sku}</p><h1 className="mt-3 text-4xl font-black tracking-tight">{product.name}</h1>{product.summary && <p className="mt-5 text-lg text-stone-600">{product.summary}</p>}<p className="mt-7 text-2xl font-black text-orange-700">{formatVnd(product.referencePrice)}</p><div className="mt-8"><MarketplaceActions marketplaces={product.marketplaces} /></div><p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-stone-700">Bạn cũng có thể đến cửa hàng để xem và mua sản phẩm trực tiếp.</p></div>
      </div>
      {product.attributes?.length ? <section className="mt-14"><h2 className="text-2xl font-black">Thông tin sản phẩm</h2><dl className="mt-5 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">{product.attributes.map((attribute) => <div key={attribute.id} className="grid gap-1 px-5 py-4 sm:grid-cols-3"><dt className="font-semibold text-stone-600">{attribute.label}</dt><dd className="sm:col-span-2">{attribute.value}</dd></div>)}</dl></section> : null}
      {product.description && <section className="mt-14"><h2 className="text-2xl font-black">Mô tả</h2><div className="mt-5 rounded-2xl border border-stone-200 bg-white p-6"><MarkdownView source={product.description} /></div></section>}
    </article>
  );
}
