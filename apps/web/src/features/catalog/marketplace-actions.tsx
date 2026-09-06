import type { PublicProduct } from './server';

function MarketplaceIcon({ marketplace }: { marketplace: 'SHOPEE' | 'TIKTOK_SHOP' }) {
  return marketplace === 'SHOPEE' ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current"><path d="M7 7V5a5 5 0 0 1 10 0v2h3l-1 14H5L4 7h3Zm2 0h6V5a3 3 0 0 0-6 0v2Zm3 11c2.1 0 3.5-1 3.5-2.7 0-1.5-1-2.2-3-2.7-1.1-.3-1.5-.5-1.5-.9 0-.4.4-.7 1.1-.7.8 0 1.6.3 2.3.8l1-1.5A5.2 5.2 0 0 0 12.2 9c-2 0-3.3 1.1-3.3 2.7 0 1.7 1.1 2.2 3.1 2.7 1 .3 1.4.5 1.4.9 0 .5-.5.7-1.3.7-1 0-1.9-.4-2.7-1.1l-1.1 1.4A5.8 5.8 0 0 0 12 18Z" /></svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current"><path d="M15 3c.4 2.2 1.7 3.5 4 3.8v3a8 8 0 0 1-4-1.2v6.1a6 6 0 1 1-5.2-5.9v3.1a3 3 0 1 0 2.2 2.8V3h3Z" /></svg>
  );
}

export function MarketplaceActions({ marketplaces }: Pick<PublicProduct, 'marketplaces'>) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {marketplaces.map((item) => {
        const label = item.marketplace === 'SHOPEE' ? 'Shopee' : 'TikTok Shop';
        if (!item.available || !item.url) {
          return <span key={item.marketplace} aria-disabled="true" title="Chưa có liên kết" className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-100 px-4 py-3 font-semibold text-stone-400"><MarketplaceIcon marketplace={item.marketplace} />{label} · Chưa có liên kết</span>;
        }
        return <a key={item.marketplace} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 font-semibold text-white no-underline hover:bg-orange-700"><MarketplaceIcon marketplace={item.marketplace} />Mua trên {label}</a>;
      })}
    </div>
  );
}
