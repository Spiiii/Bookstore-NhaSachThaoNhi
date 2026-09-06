'use client';

import type { components } from '@bookstore/contracts';
import type { AxiosInstance } from 'axios';
import { z } from 'zod';
import { normalizeApiError } from '../http/normalize-error';
import { createBrowserTransport } from '../http/transport';

export type LoginInput = components['schemas']['LoginDto'];
export type ChangePasswordInput = components['schemas']['ChangePasswordDto'];
export type AccessToken = components['schemas']['AccessTokenDto'];
export type AdminProfile = components['schemas']['AdminProfileDto'];

const accessTokenSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
});
const adminProfileSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  displayName: z.string().min(1),
  role: z.literal('ADMIN'),
});

export class AuthTransport {
  constructor(private readonly http: AxiosInstance) {}

  async login(input: LoginInput): Promise<AccessToken> {
    return this.execute(async () => accessTokenSchema.parse(
      (await this.http.post('/auth/login', input)).data,
    ));
  }
  async refresh(): Promise<AccessToken> {
    return this.execute(async () => accessTokenSchema.parse(
      (await this.http.post('/auth/refresh')).data,
    ));
  }
  async me(token: string): Promise<AdminProfile> {
    return this.execute(async () => adminProfileSchema.parse(
      (await this.http.get('/auth/me', { headers: this.bearer(token) })).data,
    ));
  }
  async logout(token: string | null): Promise<void> {
    await this.execute(async () => {
      await this.http.post(
        '/auth/logout',
        undefined,
        token ? { headers: this.bearer(token) } : undefined,
      );
    });
  }
  async changePassword(token: string, input: ChangePasswordInput): Promise<void> {
    await this.execute(async () => {
      await this.http.post('/auth/change-password', input, { headers: this.bearer(token) });
    });
  }
  private async execute<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      throw normalizeApiError(error);
    }
  }
  private bearer(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  }
}

let singleton: AuthTransport | undefined;
export function getAuthTransport(): AuthTransport {
  return (singleton ??= new AuthTransport(createBrowserTransport()));
}
