import { describe, expect, it } from 'vitest';
import { changePasswordFormSchema } from './change-password.schema';

const valid = { currentPassword: 'current-password-value', newPassword: 'new-password-value-2026', confirmPassword: 'new-password-value-2026' };

describe('change password form validation', () => {
  it('accepts distinct matching passwords that satisfy the API policy', () => {
    expect(changePasswordFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects reuse, short values, and mismatched confirmation', () => {
    expect(changePasswordFormSchema.safeParse({ ...valid, newPassword: valid.currentPassword, confirmPassword: 'different' }).success).toBe(false);
    expect(changePasswordFormSchema.safeParse({ ...valid, newPassword: 'too-short', confirmPassword: 'too-short' }).success).toBe(false);
  });
});
