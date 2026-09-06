import { describe, expect, it } from 'vitest';
import { loginFormSchema } from './login.schema';

describe('login form validation', () => {
  it('accepts the singleton admin credentials shape', () => {
    expect(loginFormSchema.safeParse({ email: 'admin@example.com', password: 'secret' }).success).toBe(true);
  });

  it('rejects malformed email and empty password', () => {
    expect(loginFormSchema.safeParse({ email: 'admin', password: '' }).success).toBe(false);
  });
});
