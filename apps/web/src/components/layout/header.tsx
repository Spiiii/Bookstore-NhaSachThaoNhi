import Link from 'next/link';
import { StorefrontNavigation } from '@/components/navigation/storefront-navigation';
import { siteConfig } from '@/config/site';

export function Header({ zaloUrl }: { zaloUrl: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-amber-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-black tracking-tight text-stone-900 no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-700">{siteConfig.name}</Link>
        <StorefrontNavigation zaloUrl={zaloUrl} />
      </div>
    </header>
  );
}
