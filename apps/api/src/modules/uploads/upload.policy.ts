import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { memoryStorage } from 'multer';

export const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp'] as const;

@Injectable()
export class UploadPolicy {
  readonly maxBytes: number;
  readonly maxPixels: number;
  readonly maxConcurrent: number;
  constructor(config: ConfigService) {
    this.maxBytes = this.integer(config, 'UPLOAD_MAX_BYTES', 5 * 1024 * 1024, 25 * 1024 * 1024);
    this.maxPixels = this.integer(config, 'UPLOAD_MAX_PIXELS', 16000000, 40000000);
    this.maxConcurrent = this.integer(config, 'UPLOAD_MAX_CONCURRENT', 2, 8);
  }
  private integer(config: ConfigService, key: string, fallback: number, cap: number): number {
    const raw = config.get<unknown>(key) ?? fallback;
    const value =
      typeof raw === 'string' && /^[1-9][0-9]*$(?![\s\S])/.test(raw) ? Number(raw) : raw;
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > cap)
      throw new Error(`${key} must be a positive integer no greater than ${cap}.`);
    return value;
  }
  multerOptions() {
    return {
      storage: memoryStorage(),
      // Multer signals at the byte limit; allow one extra byte so exactly maxBytes is valid.
      limits: {
        fileSize: this.maxBytes + 1,
        files: 1,
        fields: 0,
        parts: 2,
        fieldNameSize: 100,
        headerPairs: 100,
      },
    };
  }
}
