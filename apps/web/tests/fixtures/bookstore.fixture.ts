import { expect, request, type APIRequestContext, type Page } from '@playwright/test';

export const e2eConfig = {
  apiBase: (process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:3001').replace(/\/+$/, ''),
  origin: process.env.E2E_WEB_BASE_URL ?? 'http://127.0.0.1:3000',
  email: process.env.E2E_ADMIN_EMAIL ?? '',
  password: process.env.E2E_ADMIN_PASSWORD ?? '',
};

export function requireE2eCredentials(): void {
  if (!e2eConfig.email || !e2eConfig.password) {
    throw new Error('E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required. Use a dedicated disposable E2E environment.');
  }
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(e2eConfig.email);
  await page.getByLabel('Mật khẩu').fill(e2eConfig.password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/\/admin(?:\?|$)/);
}

export class AdminApi {
  private context?: APIRequestContext;
  private accessToken?: string;

  async connect(): Promise<void> {
    requireE2eCredentials();
    this.context = await request.newContext({ baseURL: e2eConfig.apiBase, extraHTTPHeaders: { Origin: e2eConfig.origin, Accept: 'application/json' } });
    const response = await this.context.post('/auth/login', { data: { email: e2eConfig.email, password: e2eConfig.password } });
    expect(response.ok(), `E2E API login failed: ${response.status()}`).toBeTruthy();
    this.accessToken = ((await response.json()) as { accessToken: string }).accessToken;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.delete(`/admin/products/${id}`);
  }

  async deleteNews(id: string): Promise<void> {
    await this.delete(`/admin/news/${id}`);
  }

  async close(): Promise<void> {
    await this.context?.dispose();
  }

  private headers() {
    if (!this.accessToken) throw new Error('AdminApi is not connected.');
    return { Authorization: `Bearer ${this.accessToken}` };
  }
  private async delete(path: string) {
    if (!this.context) throw new Error('AdminApi is not connected.');
    const response = await this.context.delete(path, { headers: this.headers() });
    expect(response.ok(), `DELETE ${path} failed: ${response.status()}`).toBeTruthy();
  }
}

export const onePixelPng = {
  name: 'cover.png',
  mimeType: 'image/png',
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
};
