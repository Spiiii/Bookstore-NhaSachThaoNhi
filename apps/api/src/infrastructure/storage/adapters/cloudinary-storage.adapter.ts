import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import type { StorageAdapter, StoredObject } from '../storage-adapter.interface';

const OBJECT_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CLOUDINARY_NAME = /^[a-zA-Z0-9_-]+$/;
const CLOUDINARY_FOLDER = /^[a-zA-Z0-9][a-zA-Z0-9/_-]{0,99}$/;
const REQUEST_TIMEOUT_MS = 15_000;

interface CloudinaryResult {
  readonly bytes?: number;
  readonly result?: string;
}

@Injectable()
export class CloudinaryStorageAdapter implements StorageAdapter {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly folder: string;
  private readonly maxBytes: number;

  constructor(config: ConfigService) {
    this.cloudName = this.require(config, 'CLOUDINARY_CLOUD_NAME');
    this.apiKey = this.require(config, 'CLOUDINARY_API_KEY');
    this.apiSecret = this.require(config, 'CLOUDINARY_API_SECRET');
    this.folder = (config.get<string>('CLOUDINARY_FOLDER') ?? 'bookstore').trim();
    this.maxBytes = Number(config.get<string | number>('UPLOAD_MAX_BYTES') ?? 5_242_880);

    if (!CLOUDINARY_NAME.test(this.cloudName)) {
      throw new TypeError('CLOUDINARY_CLOUD_NAME contains unsupported characters.');
    }
    if (!CLOUDINARY_FOLDER.test(this.folder) || this.folder.includes('//')) {
      throw new TypeError('CLOUDINARY_FOLDER must be a safe, non-empty asset folder.');
    }
    if (!Number.isSafeInteger(this.maxBytes) || this.maxBytes <= 0) {
      throw new TypeError('UPLOAD_MAX_BYTES must be a positive integer.');
    }
  }

  async put(data: Uint8Array): Promise<StoredObject> {
    if (!(data instanceof Uint8Array)) {
      throw new TypeError('Storage data must be a Uint8Array or Buffer.');
    }
    const bytes = Buffer.from(data);
    if (bytes.byteLength > this.maxBytes) throw new TypeError('Storage object exceeds size limit.');

    const key = randomUUID();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const publicId = this.publicId(key);
    const signed = { invalidate: 'true', overwrite: 'false', public_id: publicId, timestamp };
    const form = new FormData();
    form.set('file', new Blob([bytes]));
    form.set('api_key', this.apiKey);
    form.set('signature', this.sign(signed));
    for (const [name, value] of Object.entries(signed)) form.set(name, value);

    const result = await this.request(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      form,
    );
    return { key, size: result.bytes ?? bytes.byteLength };
  }

  async read(key: string): Promise<Buffer> {
    this.assertKey(key);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const publicId = this.publicId(key)
        .split('/')
        .map((part) => encodeURIComponent(part))
        .join('/');
      const response = await fetch(
        `https://res.cloudinary.com/${this.cloudName}/image/upload/${publicId}`,
        { signal: controller.signal },
      );
      if (response.status === 404) throw this.missing(key);
      if (!response.ok) throw new Error(`Cloudinary delivery failed with HTTP ${response.status}.`);
      const declaredSize = Number(response.headers.get('content-length') ?? 0);
      if (declaredSize > this.maxBytes) throw new Error('Cloudinary object exceeds size limit.');
      const result = Buffer.from(await response.arrayBuffer());
      if (result.byteLength > this.maxBytes)
        throw new Error('Cloudinary object exceeds size limit.');
      return result;
    } finally {
      clearTimeout(timeout);
    }
  }

  async delete(key: string): Promise<void> {
    this.assertKey(key);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signed = { invalidate: 'true', public_id: this.publicId(key), timestamp };
    const form = new FormData();
    form.set('api_key', this.apiKey);
    form.set('signature', this.sign(signed));
    for (const [name, value] of Object.entries(signed)) form.set(name, value);
    const result = await this.request(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
      form,
    );
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error('Cloudinary did not confirm object deletion.');
    }
  }

  private async request(url: string, body: FormData): Promise<CloudinaryResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { method: 'POST', body, signal: controller.signal });
      const payload = (await response.json().catch(() => ({}))) as CloudinaryResult;
      if (!response.ok) throw new Error(`Cloudinary request failed with HTTP ${response.status}.`);
      return payload;
    } finally {
      clearTimeout(timeout);
    }
  }

  private publicId(key: string): string {
    return `${this.folder}/${key}`;
  }

  private sign(values: Record<string, string>): string {
    const input = Object.entries(values)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, value]) => `${name}=${value}`)
      .join('&');
    return createHash('sha1')
      .update(input + this.apiSecret)
      .digest('hex');
  }

  private assertKey(key: string): void {
    if (typeof key !== 'string' || key.length !== 36 || !OBJECT_KEY.test(key)) {
      throw new TypeError('Invalid cloud storage object key.');
    }
  }

  private require(config: ConfigService, name: string): string {
    const value = config.get<string>(name)?.trim();
    if (!value) throw new TypeError(`${name} is required when STORAGE_PROVIDER=cloudinary.`);
    return value;
  }

  private missing(key: string): NodeJS.ErrnoException {
    return Object.assign(new Error(`Cloudinary object ${key} was not found.`), { code: 'ENOENT' });
  }
}
