import { z } from 'zod';

const utf8Length = (value: string) => new TextEncoder().encode(value).byteLength;

export const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc.').refine((value) => utf8Length(value) <= 1024, 'Mật khẩu hiện tại quá dài.'),
  newPassword: z.string().min(15, 'Mật khẩu mới phải có ít nhất 15 ký tự.').refine((value) => utf8Length(value) <= 1024, 'Mật khẩu mới quá dài.'),
  confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới.'),
}).superRefine((values, context) => {
  if (values.newPassword === values.currentPassword) {
    context.addIssue({ code: 'custom', path: ['newPassword'], message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
  }
  if (values.confirmPassword !== values.newPassword) {
    context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Mật khẩu xác nhận không khớp.' });
  }
});

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
