import Link from 'next/link';
import { siteConfig } from '@/config/site';

export function StorefrontNavigation({ zaloUrl }: { zaloUrl: string | null }) {
  return (
    <nav aria-label="Điều hướng chính" className="flex flex-wrap items-center justify-end gap-x-5 gap-y-3 text-sm font-semibold">
      {siteConfig.navigation.map((item) => (
        <Link key={item.href} href={item.href} className="text-stone-700 no-underline transition hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-700">
          {item.label}
        </Link>
      ))}
      {zaloUrl && <a href={zaloUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-blue-600 px-4 py-2 text-white no-underline transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700">Liên hệ Zalo</a>}
    </nav>
  );
}
