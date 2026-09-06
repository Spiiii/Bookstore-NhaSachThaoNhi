import 'reflect-metadata';
import {
  BadRequestException,
  PayloadTooLargeException,
  UnauthorizedException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { UploadPolicy } from '../upload.policy';
import { UploadsService } from '../uploads.service';
import type { AuthenticatedAdmin } from '../../security/types/security.types';
import { IdentityReaderService } from '../../users/identity-reader.service';

const id = '11111111-1111-4111-8111-111111111111';
const admin = { id, sessionId: id, authVersion: 1 } as AuthenticatedAdmin;
function setup(config: Record<string, unknown> = {}) {
  const current = {
    id,
    sessionId: id,
    authVersion: 1,
    role: 'ADMIN',
    sessionExpiresAt: new Date(Date.now() + 60000),
  };
  const identity = { readCurrentIdentity: jest.fn().mockResolvedValue(current) };
  const storage = {
    put: jest.fn(async (bytes: Uint8Array) => ({ key: id, size: bytes.length })),
    read: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const policy = new UploadPolicy(new ConfigService(config));
  const service = new UploadsService(storage, identity as unknown as IdentityReaderService, policy);
  return { service, storage, identity, policy };
}
const makeImage = (format: 'png' | 'jpeg' | 'webp' = 'png') =>
  sharp({ create: { width: 8, height: 8, channels: 3, background: '#123456' } })
    .toFormat(format)
    .toBuffer();
const file = (buffer: Buffer, mimetype = 'image/png') => ({
  buffer,
  size: buffer.length,
  mimetype,
});

describe('Uploads validation with real image decoding', () => {
  it.each(['png', 'jpeg', 'webp'] as const)(
    'decodes and stores %s as an immutable object',
    async (format) => {
      const s = setup();
      const bytes = await makeImage(format);
      const result = await s.service.upload(admin, file(bytes, 'image/' + format));
      expect(result).toMatchObject({
        storageKey: id,
        mimeType: 'image/' + format,
        width: 8,
        height: 8,
      });
      expect(s.identity.readCurrentIdentity).toHaveBeenCalledTimes(3);
      expect((await sharp(s.storage.put.mock.calls[0]![0]).metadata()).format).toBe(format);
    },
  );
  it('rejects MIME spoofing and executable formats without writing', async () => {
    const s = setup();
    await expect(
      s.service.upload(admin, file(await makeImage(), 'image/jpeg')),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    await expect(
      s.service.upload(admin, file(Buffer.from('<svg/>'), 'image/png')),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    expect(s.storage.put).not.toHaveBeenCalled();
  });
  it('rejects missing, empty and malformed images', async () => {
    const s = setup();
    await expect(s.service.upload(admin, undefined)).rejects.toBeInstanceOf(BadRequestException);
    await expect(s.service.upload(admin, file(Buffer.alloc(0)))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const png = await makeImage();
    await expect(s.service.upload(admin, file(png.subarray(0, 30)))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(s.storage.put).not.toHaveBeenCalled();
  });
  it('enforces input byte and decoded pixel limits', async () => {
    const bytes = await makeImage();
    await expect(
      setup({ UPLOAD_MAX_BYTES: bytes.length - 1 }).service.upload(admin, file(bytes)),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
    await expect(
      setup({ UPLOAD_MAX_PIXELS: 16 }).service.upload(admin, file(bytes)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('accepts exactly the configured byte limit', async () => {
    const bytes = await makeImage();
    await expect(
      setup({ UPLOAD_MAX_BYTES: bytes.length }).service.upload(admin, file(bytes)),
    ).resolves.toHaveProperty('storageKey', id);
  });
  it('rejects animated WebP rather than silently keeping the first frame', async () => {
    const pixels = Buffer.concat([Buffer.alloc(2 * 2 * 3, 0), Buffer.alloc(2 * 2 * 3, 255)]);
    const bytes = await sharp(pixels, { raw: { width: 2, height: 4, channels: 3, pageHeight: 2 } })
      .webp({ loop: 0, delay: [100, 100] })
      .toBuffer();
    expect((await sharp(bytes, { animated: true }).metadata()).pages).toBe(2);
    const s = setup();
    await expect(s.service.upload(admin, file(bytes, 'image/webp'))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(s.storage.put).not.toHaveBeenCalled();
  });
  it('strips metadata and appended content by re-encoding', async () => {
    const source = await sharp(await makeImage('jpeg'))
      .withMetadata()
      .jpeg()
      .toBuffer();
    const s = setup();
    await s.service.upload(
      admin,
      file(Buffer.concat([source, Buffer.from('<script>bad</script>')]), 'image/jpeg'),
    );
    const stored = Buffer.from(s.storage.put.mock.calls[0]![0]);
    expect(stored.includes(Buffer.from('<script>'))).toBe(false);
    expect((await sharp(stored).metadata()).exif).toBeUndefined();
  });
  it('rejects a replaced session before storing bytes', async () => {
    const s = setup();
    s.identity.readCurrentIdentity.mockResolvedValue(null);
    await expect(s.service.upload(admin, file(await makeImage()))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(s.storage.put).not.toHaveBeenCalled();
  });
  it('removes only the new unreturned object when the session changes during put', async () => {
    const s = setup();
    s.storage.put.mockImplementation(async (bytes) => {
      s.identity.readCurrentIdentity.mockResolvedValue(null);
      return { key: id, size: bytes.length };
    });
    await expect(s.service.upload(admin, file(await makeImage()))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(s.storage.delete).toHaveBeenCalledWith(id);
  });
  it('propagates storage failures instead of reporting success', async () => {
    const s = setup();
    s.storage.put.mockRejectedValue(new Error('disk full'));
    await expect(s.service.upload(admin, file(await makeImage()))).rejects.toThrow('disk full');
    expect(s.storage.delete).not.toHaveBeenCalled();
  });
  it('validates config and caps memory/decompression settings', () => {
    expect(new UploadPolicy(new ConfigService()).maxBytes).toBe(5 * 1024 * 1024);
    for (const raw of ['0x10', 0, null, '', true, 30 * 1024 * 1024]) {
      if (raw === null) continue;
      expect(() => new UploadPolicy(new ConfigService({ UPLOAD_MAX_BYTES: raw }))).toThrow();
    }
  });
});
