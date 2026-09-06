import type { ReactNode } from 'react';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { configuredZaloUrl } from '@/config/seo.server';

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fffdf8] text-stone-900">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Đi đến nội dung chính</a>
      <Header zaloUrl={configuredZaloUrl()} />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <Footer />
    </div>
  );
}
