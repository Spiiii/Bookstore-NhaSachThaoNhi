import { expect, test } from '@playwright/test';
import { AdminApi, loginAsAdmin, onePixelPng, requireE2eCredentials } from '../fixtures/bookstore.fixture';

test.describe('product management and storefront', () => {
  test.beforeAll(requireE2eCredentials);

  test('admin creates an image-backed product and publishes it to the catalogue', async ({ page }) => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const slug = `e2e-book-${suffix}`;
    const sku = `E2E-${suffix}`.toUpperCase();
    const name = `Sách E2E ${suffix}`;
    let productId: string | undefined;
    try {
      await loginAsAdmin(page);
      await page.goto('/admin/products/new');
      await page.getByLabel('Mã sản phẩm').fill(sku);
      await page.getByLabel('Slug').fill(slug);
      await page.getByLabel('Tên sản phẩm').fill(name);
      await page.getByLabel('Giá tham khảo (VND)').fill('125000');
      await page.getByLabel('Mô tả ngắn').fill('Sản phẩm được tạo bởi E2E test.');
      await page.getByLabel('Mô tả Markdown').fill('## Mô tả E2E\n\nNội dung an toàn.');
      await page.getByRole('button', { name: 'Tạo sản phẩm' }).click();
      await expect(page).toHaveURL(/\/admin\/products\/[0-9a-f-]+\/edit/);
      productId = /\/admin\/products\/([0-9a-f-]+)\/edit/.exec(new URL(page.url()).pathname)?.[1];
      expect(productId).toBeTruthy();

      const images = page.getByRole('heading', { name: 'Ảnh sản phẩm' }).locator('..').locator('..');
      await images.locator('input[type=file]').setInputFiles(onePixelPng);
      await images.getByPlaceholder('Alt text').fill(name);
      await images.getByLabel('Đặt làm ảnh chính').check();
      await images.getByRole('button', { name: 'Tải và thêm ảnh' }).click();
      await expect(images.getByRole('button', { name: 'Xóa' })).toBeVisible();

      await page.goto(`/admin/products?q=${encodeURIComponent(name)}`);
      const row = page.getByRole('row').filter({ hasText: name });
      await row.getByRole('button', { name: 'Công khai' }).click();
      await expect(row.getByText('Công khai', { exact: true })).toBeVisible();

      await page.goto(`/products?q=${encodeURIComponent(name)}`);
      await page.getByRole('link', { name: new RegExp(name) }).click();
      await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
      await expect(page.getByText('125.000')).toBeVisible();
      await expect(page.getByText('Chưa có liên kết', { exact: true })).toHaveCount(2);
    } finally {
      if (productId) {
        const api = new AdminApi();
        await api.connect();
        await api.deleteProduct(productId);
        await api.close();
      }
    }
  });
});
