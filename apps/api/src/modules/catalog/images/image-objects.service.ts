import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  STORAGE_ADAPTER,
  type StorageAdapter,
} from '../../../infrastructure/storage/storage-adapter.interface';

@Injectable()
export class ImageObjectsService {
  constructor(@Inject(STORAGE_ADAPTER) private readonly storage: StorageAdapter) {}
  async read(key: string): Promise<{ bytes: Buffer; mime: string }> {
    let bytes: Buffer;
    try {
      bytes = await this.storage.read(key);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        throw new BadRequestException('Image object does not exist.');
      }
      throw error;
    }
    // Uploads owns full image decoding/validation. Catalog additionally rejects non-image/SVG references.
    let mime: string | undefined;
    if (
      bytes.length >= 24 &&
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
      bytes.toString('ascii', 12, 16) === 'IHDR'
    )
      mime = 'image/png';
    if (
      bytes.length >= 4 &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255 &&
      bytes[bytes.length - 2] === 255 &&
      bytes[bytes.length - 1] === 217
    )
      mime = 'image/jpeg';
    if (
      bytes.length >= 12 &&
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP'
    )
      mime = 'image/webp';
    if (!mime) throw new BadRequestException('A validated PNG, JPEG or WebP upload is required.');
    return { bytes, mime };
  }
}
