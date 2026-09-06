import { expect, test } from '@playwright/test';
import { AdminApi, loginAsAdmin, requireE2eCredentials } from '../fixtures/bookstore.fixture';

test.describe('news management and storefront', () => {
  test.beforeAll(requireE2eCredentials);

  test('admin publishes Markdown news and visitors can read its public projection', async ({ page }) => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const slug = `e2e-news-${suffix}`;
    const title = `Tin E2E ${suffix}`;
    let newsId: string | undefined;
    try {
      await loginAsAdmin(page);
      await page.goto('/admin/news/new');
      await page.getByLabel('Tiêu đề').fill(title);
      await page.getByLabel('Slug').fill(slug);
      await page.getByLabel('Tóm tắt và SEO description').fill('Tóm tắt E2E công khai.');
      await page.getByLabel('Nội dung Markdown').fill('## Nội dung E2E\n\nĐây là **bài viết kiểm thử**.\n\n<script>alert(1)</script>');
      await page.getByLabel('Trạng thái').selectOption('PUBLISHED');
      await page.getByRole('button', { name: 'Tạo bài viết' }).click();
      await expect(page).toHaveURL(/\/admin\/news\/[0-9a-f-]+\/edit/);
      newsId = /\/admin\/news\/([0-9a-f-]+)\/edit/.exec(new URL(page.url()).pathname)?.[1];
      expect(newsId).toBeTruthy();

      await page.goto('/news');
      await page.getByRole('link', { name: title }).click();
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'Nội dung E2E' })).toBeVisible();
      await expect(page.getByText('bài viết kiểm thử')).toBeVisible();
      await expect(page.locator('article script')).toHaveCount(0);
    } finally {
      if (newsId) {
        const api = new AdminApi();
        await api.connect();
        await api.deleteNews(newsId);
        await api.close();
      }
    }
  });
});
