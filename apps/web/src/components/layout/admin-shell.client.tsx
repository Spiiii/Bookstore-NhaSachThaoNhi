'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/client';
import { AdminNavigation } from '@/components/navigation/admin-navigation.client';

function loginHref(reason: string | null): string {
  return reason ? `/login?reason=${encodeURIComponent(reason)}` : '/login';
}

export function AdminShell({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (auth.status === 'anonymous') router.replace(loginHref(auth.reason));
  }, [auth.reason, auth.status, router]);

  if (auth.status === 'initializing') {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-100" aria-busy="true">
        <p className="rounded-2xl bg-white px-6 py-4 font-semibold text-stone-600 shadow-sm">Đang xác minh phiên quản trị…</p>
      </main>
    );
  }

  if (auth.status === 'error') {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-100 px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold">Không thể khởi tạo khu vực quản trị</h1>
          <p className="mt-3 text-stone-600">Vui lòng kiểm tra cấu hình API trước khi thử lại.</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-stone-900 px-5 py-3 font-semibold text-white no-underline">Về trang chủ</Link>
        </div>
      </main>
    );
  }

  if (auth.status !== 'authenticated' || !auth.profile) {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-100" aria-busy="true">
        <p className="text-stone-600">Đang chuyển đến trang đăng nhập…</p>
      </main>
    );
  }

  async function signOut() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await auth.logout();
      router.replace('/login');
    } catch {
      router.replace('/login?reason=logout-unconfirmed');
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <a href="#admin-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Đi đến nội dung quản trị</a>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div><Link href="/admin" className="text-lg font-black text-stone-900 no-underline">Quản trị Nhà sách</Link><p className="text-xs text-stone-500">{auth.profile.displayName} · {auth.profile.email}</p></div>
          <div className="flex items-center gap-3"><Link href="/" target="_blank" rel="noopener noreferrer" className="hidden rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 no-underline sm:inline-flex">Xem website</Link><button type="button" onClick={() => void signOut()} disabled={loggingOut} className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</button></div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[90rem] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-b border-stone-800 bg-stone-950 lg:min-h-[calc(100vh-81px)] lg:border-b-0 lg:border-r"><AdminNavigation /></aside>
        <main id="admin-content" tabIndex={-1} className="min-w-0 p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
