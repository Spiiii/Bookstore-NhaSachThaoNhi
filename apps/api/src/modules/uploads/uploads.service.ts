import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  PayloadTooLargeException,
  UnauthorizedException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import sharp from 'sharp';
import {
  STORAGE_ADAPTER,
  type StorageAdapter,
} from '../../infrastructure/storage/storage-adapter.interface';
import { IdentityReaderService } from '../users/identity-reader.service';
import type { AuthenticatedAdmin } from '../security/types/security.types';
import { IMAGE_MIMES, UploadPolicy } from './upload.policy';
import type { UploadResponseDto } from './uploads.response';
import { assertStaticPng } from './png-policy';

type UploadFile = Pick<Express.Multer.File, 'buffer' | 'size' | 'mimetype'>;

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  constructor(
    @Inject(STORAGE_ADAPTER) private readonly storage: StorageAdapter,
    private readonly identity: IdentityReaderService,
    private readonly policy: UploadPolicy,
  ) {}

  async upload(
    admin: AuthenticatedAdmin,
    file: UploadFile | undefined,
  ): Promise<UploadResponseDto> {
    if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0)
      throw new BadRequestException('A nonempty image in multipart field "file" is required.');
    if (file.buffer.length > this.policy.maxBytes || file.size > this.policy.maxBytes)
      throw new PayloadTooLargeException('Image exceeds the upload size limit.');
    if (file.size !== file.buffer.length) throw new BadRequestException('Invalid image size.');
    const format = this.detect(file.buffer);
    const mimeType =
      format === 'jpeg'
        ? 'image/jpeg'
        : format === 'png'
          ? 'image/png'
          : format === 'webp'
            ? 'image/webp'
            : undefined;
    if (
      !mimeType ||
      !IMAGE_MIMES.some((mime) => mime === file.mimetype) ||
      mimeType !== file.mimetype
    )
      throw new UnsupportedMediaTypeException(
        'Declared MIME and image data must match PNG, JPEG or WebP.',
      );

    if (format === 'png') assertStaticPng(file.buffer);
    await this.assertSession(admin);
    const image = sharp(file.buffer, {
      failOn: 'warning',
      limitInputPixels: this.policy.maxPixels,
      animated: true,
    });
    let output: { data: Buffer; info: { width: number; height: number } };
    try {
      const metadata = await image.metadata();
      if (
        metadata.format !== format ||
        (metadata.pages ?? 1) !== 1 ||
        !metadata.width ||
        !metadata.height ||
        metadata.width * metadata.height > this.policy.maxPixels
      )
        throw new Error('Unsupported image dimensions or animation.');
      // Full decode/re-encode, strip metadata by default and preserve visual EXIF orientation.
      output = await image
        .rotate()
        .toFormat(format!)
        .timeout({ seconds: 10 })
        .toBuffer({ resolveWithObject: true });
    } catch {
      throw new BadRequestException(
        'Image is malformed, animated, too large in pixels or cannot be decoded.',
      );
    } finally {
      image.destroy();
    }
    if (output.data.length > this.policy.maxBytes)
      throw new PayloadTooLargeException('Processed image exceeds the upload size limit.');
    await this.assertSession(admin);
    const stored = await this.storage.put(output.data);
    try {
      await this.assertSession(admin);
    } catch (error) {
      // This new key was never returned or attached; only this request owns it.
      try {
        await this.storage.delete(stored.key);
      } catch {
        this.logger.error(
          `Failed to remove unreturned upload ${stored.key}; operational cleanup required.`,
        );
      }
      throw error;
    }
    return {
      storageKey: stored.key,
      size: stored.size,
      mimeType,
      width: output.info.width,
      height: output.info.height,
    };
  }

  private detect(bytes: Buffer): 'png' | 'jpeg' | 'webp' | undefined {
    if (
      bytes.length >= 24 &&
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
      bytes.toString('ascii', 12, 16) === 'IHDR'
    )
      return 'png';
    if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
      return 'jpeg';
    if (
      bytes.length >= 12 &&
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP'
    )
      return 'webp';
    return undefined;
  }
  private async assertSession(admin: AuthenticatedAdmin): Promise<void> {
    const current = await this.identity.readCurrentIdentity();
    if (
      !current ||
      current.id !== admin.id ||
      current.role !== 'ADMIN' ||
      current.sessionId !== admin.sessionId ||
      current.authVersion !== admin.authVersion ||
      !current.sessionExpiresAt ||
      current.sessionExpiresAt.getTime() <= Date.now()
    )
      throw new UnauthorizedException({
        code: 'SESSION_REPLACED',
        message: 'Session is no longer current.',
      });
  }
}
