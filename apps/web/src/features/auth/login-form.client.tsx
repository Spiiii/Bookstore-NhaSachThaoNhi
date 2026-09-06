'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { normalizeApiError } from '@/lib/http/normalize-error';
import { useAuth } from '@/providers/auth-provider.client';
import { loginFormSchema, type LoginFormValues } from './login.schema';

const reasonMessage: Record<string, string> = {
  'password-changed': 'Mật khẩu đã được đổi. Vui lòng đăng nhập lại bằng mật khẩu mới.',
  'session-ended': 'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.',
  'signed-out': 'Bạn đã đăng xuất.',
  'logout-unconfirmed': 'Phiên cục bộ đã được xóa. Vui lòng đăng nhập lại.',
  'coordination-unavailable': 'Trình duyệt không thể điều phối phiên an toàn. Vui lòng đăng nhập lại.',
};
const inputClass = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100';

export function LoginForm() {
  const auth = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema), defaultValues: { email: '', password: '' } });

  useEffect(() => {
    if (auth.status === 'authenticated') router.replace('/admin');
  }, [auth.status, router]);

  async function submit(values: LoginFormValues) {
    form.clearErrors('root');
    try {
      await auth.login(values);
      form.reset();
      router.replace('/admin');
    } catch (error) {
      const normalized = normalizeApiError(error);
      form.setError('root', { message: normalized.code === 'INVALID_CREDENTIALS' ? 'Email hoặc mật khẩu không đúng.' : normalized.message });
    }
  }

  if (auth.status === 'initializing' || auth.status === 'authenticated') {
    return <p aria-busy="true" className="rounded-2xl bg-white p-6 text-center shadow-sm">Đang kiểm tra phiên…</p>;
  }
  if (auth.status === 'error') {
    return <p role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">Không thể khởi tạo đăng nhập. Vui lòng kiểm tra cấu hình API.</p>;
  }
  const reason = search.get('reason');

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
      {reason && reasonMessage[reason] && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{reasonMessage[reason]}</p>}
      {form.formState.errors.root?.message && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{form.formState.errors.root.message}</p>}
      <label className="block text-sm font-semibold">Email<input type="email" autoComplete="username" {...form.register('email')} className={inputClass} />{form.formState.errors.email && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.email.message}</span>}</label>
      <label className="block text-sm font-semibold">Mật khẩu<input type="password" autoComplete="current-password" {...form.register('password')} className={inputClass} />{form.formState.errors.password && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.password.message}</span>}</label>
      <button type="submit" disabled={form.formState.isSubmitting} className="w-full rounded-xl bg-orange-600 px-6 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-60">{form.formState.isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
    </form>
  );
}
