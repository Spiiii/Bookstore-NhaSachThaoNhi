'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/admin', label: 'Tổng quan' },
  { href: '/admin/products', label: 'Sản phẩm' },
  { href: '/admin/categories', label: 'Danh mục' },
  { href: '/admin/brands', label: 'Thương hiệu' },
  { href: '/admin/news', label: 'Tin tức' },
  { href: '/admin/banners', label: 'Banner' },
  { href: '/admin/security/password', label: 'Đổi mật khẩu' },
] as const;

export function AdminNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Điều hướng quản trị" className="flex gap-2 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const active = item.href === '/admin'
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold no-underline transition ${active ? 'bg-orange-600 text-white' : 'text-stone-300 hover:bg-stone-800 hover:text-white'}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
