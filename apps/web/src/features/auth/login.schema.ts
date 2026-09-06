import { z } from 'zod';

const utf8Length = (value: string) => new TextEncoder().encode(value).byteLength;

export const loginFormSchema = z.object({
  email: z.email('Email không hợp lệ.').max(254, 'Email quá dài.'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc.').refine((value) => utf8Length(value) <= 1024, 'Mật khẩu quá dài.'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
