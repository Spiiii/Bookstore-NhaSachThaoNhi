import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { UploadsModule } from '../../src/modules/uploads/uploads.module';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { STORAGE_ADAPTER } from '../../src/infrastructure/storage/storage-adapter.interface';
import { IdentityReaderService } from '../../src/modules/users/identity-reader.service';
import { SecurityTokenService } from '../../src/modules/security/services/security-token.service';

const id = '11111111-1111-4111-8111-111111111111';
describe('Uploads multipart HTTP and authorization', () => {
  let app: INestApplication;
  let base: string;
  let access: string;
  let png: Buffer;
  const storage = {
    put: jest.fn(async (bytes: Uint8Array) => ({ key: id, size: bytes.length })),
    read: jest.fn(),
    delete: jest.fn(),
  };
  const upload = (body: FormData, authenticated = true) =>
    fetch(base + '/admin/uploads', {
      method: 'POST',
      headers: authenticated ? { Authorization: 'Bearer ' + access } : {},
      body,
    });
  const form = (bytes: Buffer, mime = 'image/png', name = 'file') => {
    const body = new FormData();
    body.append(name, new Blob([new Uint8Array(bytes)], { type: mime }), 'untrusted-name.exe');
    return body;
  };
  beforeAll(async () => {
    const identity = {
      id,
      email: 'admin@example.test',
      displayName: 'Admin',
      role: 'ADMIN',
      authVersion: 1,
      sessionId: id,
      sessionExpiresAt: new Date(Date.now() + 3600000),
    };
    const module = await Test.createTestingModule({ imports: [UploadsModule] })
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService({
          STORAGE_LOCAL_ROOT: process.cwd(),
          UPLOAD_MAX_BYTES: 1024,
          JWT_ACCESS_SECRET: randomBytes(32).toString('base64'),
          JWT_REFRESH_SECRET: randomBytes(32).toString('base64'),
          JWT_ISSUER: 'uploads-test',
          JWT_ACCESS_AUDIENCE: 'access',
          JWT_REFRESH_AUDIENCE: 'refresh',
        }),
      )
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(STORAGE_ADAPTER)
      .useValue(storage)
      .overrideProvider(IdentityReaderService)
      .useValue({ readCurrentIdentity: async () => identity })
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
    access = await app.get(SecurityTokenService).signAccess({
      adminId: id,
      sessionId: id,
      authVersion: 1,
      sessionExpiresAt: identity.sessionExpiresAt,
    });
    png = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#123456' } })
      .png()
      .toBuffer();
  });
  beforeEach(() => storage.put.mockClear());
  afterAll(async () => {
    await app?.close();
  });
  it('requires current admin before multipart handling', async () => {
    expect((await upload(form(png), false)).status).toBe(401);
    expect(storage.put).not.toHaveBeenCalled();
  });
  it('stores a real decoded image and returns an opaque key, ignoring filename', async () => {
    const response = await upload(form(png));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      storageKey: id,
      mimeType: 'image/png',
      width: 2,
      height: 2,
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('enforces multipart size limits before storage', async () => {
    expect((await upload(form(Buffer.alloc(2048)))).status).toBe(413);
    expect(storage.put).not.toHaveBeenCalled();
  });
  it('rejects MIME mismatch and invalid image bytes', async () => {
    expect((await upload(form(png, 'image/jpeg'))).status).toBe(415);
    expect((await upload(form(Buffer.from('<svg/>')))).status).toBe(415);
    expect(storage.put).not.toHaveBeenCalled();
  });
  it('rejects missing/wrong fields, extra text fields and multiple files', async () => {
    expect((await upload(new FormData())).status).toBe(400);
    expect((await upload(form(png, 'image/png', 'other'))).status).toBe(400);
    const text = form(png);
    text.append('ownerId', id);
    expect((await upload(text)).status).toBe(400);
    const two = form(png);
    two.append('file', new Blob([new Uint8Array(png)], { type: 'image/png' }), 'second.png');
    expect((await upload(two)).status).toBe(400);
    expect(storage.put).not.toHaveBeenCalled();
  });
});
