import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { crc32 } from 'node:zlib';
import sharp from 'sharp';
import { UploadAdmissionInterceptor } from '../upload-admission.interceptor';
import { UploadPolicy } from '../upload.policy';
import { assertStaticPng } from '../png-policy';

function chunk(type: string, data: Buffer) {
  const prefix = Buffer.alloc(8);
  prefix.writeUInt32BE(data.length);
  prefix.write(type, 4);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type), data])));
  return Buffer.concat([prefix, data, crc]);
}
describe('Upload admission and APNG regression', () => {
  it('rejects animation chunks and malformed PNG lengths but accepts static PNG', async () => {
    const png = await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
      .png()
      .toBuffer();
    expect(() => assertStaticPng(png)).not.toThrow();
    const data = Buffer.alloc(8);
    data.writeUInt32BE(2);
    const apng = Buffer.concat([png.subarray(0, 33), chunk('acTL', data), png.subarray(33)]);
    expect(() => assertStaticPng(apng)).toThrow('Animated PNG');
    const malformed = Buffer.from(png);
    malformed.writeUInt32BE(0xffffffff, 8);
    expect(() => assertStaticPng(malformed)).toThrow('Truncated PNG');
  });
  it('rejects excess requests before downstream interception and releases capacity on failure', async () => {
    const interceptor = new UploadAdmissionInterceptor(
      new UploadPolicy(new ConfigService({ UPLOAD_MAX_CONCURRENT: 1 })),
    );
    const setHeader = jest.fn();
    const context = {
      switchToHttp: () => ({ getResponse: () => ({ setHeader }) }),
    } as unknown as ExecutionContext;
    const slow = new Subject<string>();
    const first = firstValueFrom(interceptor.intercept(context, { handle: () => slow }));
    const handle = jest.fn(() => of('excess'));
    await expect(firstValueFrom(interceptor.intercept(context, { handle }))).rejects.toMatchObject({
      status: 429,
    });
    expect(handle).not.toHaveBeenCalled();
    expect(setHeader).toHaveBeenCalledWith('Retry-After', '2');
    slow.next('done');
    await first;
    await expect(
      firstValueFrom(
        interceptor.intercept(context, {
          handle: () => throwError(() => new Error('multipart failed')),
        }),
      ),
    ).rejects.toThrow();
    await expect(
      firstValueFrom(interceptor.intercept(context, { handle: () => of('ok') })),
    ).resolves.toBe('ok');
  });
});
