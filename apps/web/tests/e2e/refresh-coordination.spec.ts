import { expect, test } from '@playwright/test';
import { loginAsAdmin, requireE2eCredentials } from '../fixtures/bookstore.fixture';

test.describe('cross-tab refresh coordination', () => {
  test.beforeAll(requireE2eCredentials);

  test('simultaneous tabs rotate the shared refresh cookie only once', async ({ browser }) => {
    const context = await browser.newContext();
    try {
      const original = await context.newPage();
      await loginAsAdmin(original);
      let refreshRequests = 0;
      context.on('request', (request) => {
        if (request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/auth/refresh')) refreshRequests += 1;
      });
      const first = await context.newPage();
      const second = await context.newPage();
      await Promise.all([first.goto('/admin/products'), second.goto('/admin/news')]);
      await expect(first.getByText('Quản trị Nhà sách')).toBeVisible();
      await expect(second.getByText('Quản trị Nhà sách')).toBeVisible();
      expect(refreshRequests).toBe(1);
      await original.goto('/admin/banners');
      await expect(original).toHaveURL(/\/admin\/banners$/);
    } finally {
      await context.close();
    }
  });
});
