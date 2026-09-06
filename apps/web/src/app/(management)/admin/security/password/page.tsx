import { ChangePasswordForm } from '@/features/auth/client';

export const metadata = { title: 'Đổi mật khẩu' };

export default function PasswordPage() {
  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-orange-700">Bảo mật</p>
        <h1 className="mt-1 text-3xl font-black">Đổi mật khẩu</h1>
        <p className="mt-2 text-stone-600">
          Thao tác này cập nhật tài khoản admin duy nhất và thu hồi phiên đăng nhập trên mọi thiết bị.
        </p>
      </div>
      <ChangePasswordForm />
    </section>
  );
}
