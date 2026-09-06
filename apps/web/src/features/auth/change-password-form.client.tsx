'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { normalizeApiError } from '@/lib/http/normalize-error';
import { useAuth } from '@/providers/auth-provider.client';
import { changePasswordFormSchema, type ChangePasswordFormValues } from './change-password.schema';

const inputClass = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-100';

export function ChangePasswordForm() {
  const auth = useAuth();
  const router = useRouter();
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  async function submit(values: ChangePasswordFormValues) {
    form.clearErrors('root');
    try {
      await auth.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      form.reset();
      router.replace('/login?reason=password-changed');
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.code === 'INVALID_CREDENTIALS') {
        form.setError('currentPassword', { message: 'Mật khẩu hiện tại không đúng.' });
        return;
      }
      form.setError('root', { message: normalized.message });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
      {form.formState.errors.root?.message && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{form.formState.errors.root.message}</p>}
      <label className="block text-sm font-semibold">Mật khẩu hiện tại<input type="password" autoComplete="current-password" {...form.register('currentPassword')} className={inputClass} />{form.formState.errors.currentPassword && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.currentPassword.message}</span>}</label>
      <label className="block text-sm font-semibold">Mật khẩu mới<input type="password" autoComplete="new-password" {...form.register('newPassword')} className={inputClass} /><span className="mt-1 block text-xs font-normal text-stone-500">Sử dụng ít nhất 15 ký tự.</span>{form.formState.errors.newPassword && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.newPassword.message}</span>}</label>
      <label className="block text-sm font-semibold">Nhập lại mật khẩu mới<input type="password" autoComplete="new-password" {...form.register('confirmPassword')} className={inputClass} />{form.formState.errors.confirmPassword && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.confirmPassword.message}</span>}</label>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Sau khi đổi mật khẩu, phiên hiện tại và mọi phiên cũ đều mất hiệu lực. Bạn cần đăng nhập lại bằng mật khẩu mới.</div>
      <button type="submit" disabled={form.formState.isSubmitting} className="rounded-xl bg-orange-600 px-6 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-60">{form.formState.isSubmitting ? 'Đang đổi mật khẩu…' : 'Đổi mật khẩu'}</button>
    </form>
  );
}
