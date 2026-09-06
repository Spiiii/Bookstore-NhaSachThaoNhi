import { expect, test } from '@playwright/test';
import { loginAsAdmin, requireE2eCredentials } from '../fixtures/bookstore.fixture';

test.describe('session replacement propagation', () => {
  test.beforeAll(requireE2eCredentials);

  test('a replacement login clears every tab of the previous browser session', async ({ browser }) => {
    const oldDevice = await browser.newContext();
    const newDevice = await browser.newContext();
    try {
      const oldProducts = await oldDevice.newPage();
      await loginAsAdmin(oldProducts);
      const oldNews = await oldDevice.newPage();
      await oldNews.goto('/admin/news');
      await expect(oldNews.getByText('Quản trị Nhà Sách Thảo Nhi Long Giao')).toBeVisible();

      const replacement = await newDevice.newPage();
      await loginAsAdmin(replacement);

      await Promise.all([oldProducts.reload(), oldNews.reload()]);
      await expect(oldProducts).toHaveURL(/\/login\?reason=(?:session-ended|signed-out)/);
      await expect(oldNews).toHaveURL(/\/login\?reason=(?:session-ended|signed-out)/);
      await expect(replacement.getByText('Quản trị Nhà Sách Thảo Nhi Long Giao')).toBeVisible();
    } finally {
      await oldDevice.close();
      await newDevice.close();
    }
  });
});
