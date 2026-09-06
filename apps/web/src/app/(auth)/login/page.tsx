import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/client';

export const metadata = { title: 'Đăng nhập quản trị' };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-stone-100 px-4 py-12">
      <section className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-700">Bookstore</p>
          <h1 className="mt-2 text-3xl font-black">Đăng nhập quản trị</h1>
          <p className="mt-2 text-sm text-stone-600">Khu vực dành cho tài khoản admin duy nhất.</p>
        </div>
        <Suspense fallback={<p aria-busy="true" className="rounded-2xl bg-white p-6 text-center shadow-sm">Đang kiểm tra phiên…</p>}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
