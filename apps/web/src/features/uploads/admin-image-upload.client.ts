'use client';

import type { components } from '@bookstore/contracts';
import { z } from 'zod';
import { getBrowserClient } from '@/lib/http/browser-client';

export type ImageUploadResult = components['schemas']['UploadResponseDto'];

const imageUploadSchema = z.object({
  storageKey: z.uuid(),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
  size: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export async function uploadAdminImage(file: File): Promise<ImageUploadResult> {
  const body = new FormData();
  body.append('file', file);
  return imageUploadSchema.parse((await getBrowserClient().post('/admin/uploads', body)).data);
}
