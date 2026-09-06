import Image from 'next/image';
import Link from 'next/link';
import { publicMediaUrl } from '@/lib/http/public-api.server';
import type { PublicProduct } from './server';
import { formatVnd } from './product-format';

export function ProductCard({ product }: { product: PublicProduct }) {
  const primary = product.images.find((image) => image.isPrimary) ?? product.images[0];
  return (
    <article className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="block no-underline">
        <div className="relative aspect-[4/3] bg-amber-50">
          {primary ? (
            <Image src={publicMediaUrl(primary.url)!} alt={primary.altText ?? product.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-stone-500">Chưa có ảnh</div>
          )}
        </div>
        <div className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-700">{product.sku}</p>
          <h2 className="mt-2 text-lg font-bold text-stone-900 group-hover:text-orange-700">{product.name}</h2>
          {product.summary && <p className="mt-2 line-clamp-2 text-sm text-stone-600">{product.summary}</p>}
          <p className="mt-4 font-bold text-stone-900">{formatVnd(product.referencePrice)}</p>
        </div>
      </Link>
    </article>
  );
}
