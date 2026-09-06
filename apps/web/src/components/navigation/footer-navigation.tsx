import Link from 'next/link';
import { siteConfig } from '@/config/site';

export function FooterNavigation() {
  return (
    <nav aria-label="Điều hướng cuối trang" className="flex flex-wrap gap-x-5 gap-y-2">
      {siteConfig.navigation.map((item) => <Link key={item.href} href={item.href} className="text-stone-300 no-underline hover:text-white">{item.label}</Link>)}
    </nav>
  );
}
