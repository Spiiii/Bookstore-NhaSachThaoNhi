import { expect, test } from '@playwright/test';
import { e2eConfig, loginAsAdmin, requireE2eCredentials } from '../fixtures/bookstore.fixture';

test.describe('singleton admin authentication', () => {
  test.beforeAll(requireE2eCredentials);

  test('rejects invalid credentials without exposing account details', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(e2eConfig.email);
    await page.getByLabel('Mật khẩu').fill(`${e2eConfig.password}-wrong`);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByRole('alert')).toHaveText('Email hoặc mật khẩu không đúng.');
    await expect(page).toHaveURL(/\/login/);
  });

  test('a new device login invalidates the previous device immediately', async ({ browser }) => {
    const first = await browser.newContext();
    const second = await browser.newContext();
    try {
      const firstPage = await first.newPage();
      const secondPage = await second.newPage();
      await loginAsAdmin(firstPage);
      await loginAsAdmin(secondPage);
      await firstPage.goto('/admin/products');
      await expect(firstPage).toHaveURL(/\/login\?reason=(?:session-ended|signed-out)/);
      await expect(secondPage.getByText('Quản trị Nhà Sách Thảo Nhi Long Giao')).toBeVisible();
    } finally {
      await first.close();
      await second.close();
    }
  });
});
