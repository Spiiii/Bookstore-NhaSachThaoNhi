import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { PasswordModule } from '../../src/infrastructure/credentials/password.module';
import { PasswordService } from '../../src/infrastructure/credentials/password.service';

describe('PasswordModule (native Argon2id, no database or HTTP)', () => {
  const service = new PasswordService(new ConfigService());
  const password = '  Sách 📚 mật khẩu thử nghiệm  ';
  let encoded: string;

  beforeAll(async () => {
    encoded = await service.hash(password);
  });

  it('exports an injectable service from an isolated Nest context', async () => {
    const context = await Test.createTestingModule({ imports: [PasswordModule] }).compile();
    try {
      expect(context.get(PasswordService)).toBeInstanceOf(PasswordService);
    } finally {
      await context.close();
    }
  });

  it('generates independently salted PHC hashes that fit the approved storage column', async () => {
    const other = await service.hash(password);
    expect(other).not.toBe(encoded);
    expect(encoded).toMatch(/^\$argon2id\$v=19\$/);
    expect(encoded.length).toBeLessThanOrEqual(255);
    expect(await argon2.verify(encoded, password)).toBe(true);
    expect(await service.verify(password, other)).toBe(true);
    expect(service.needsRehash(encoded)).toBe(false);
  });

  it('preserves whitespace and Unicode instead of trimming or normalizing', async () => {
    expect(await service.verify(password, encoded)).toBe(true);
    expect(await service.verify(password.trim(), encoded)).toBe(false);
    expect(await service.verify(password.normalize('NFD'), encoded)).toBe(false);
    expect(await service.verify('wrong password', encoded)).toBe(false);
  });

  it('accepts either PHC parameter ordering', async () => {
    const parts = encoded.split('$');
    parts[3] = parts[3]!.split(',').reverse().join(',');
    const reordered = parts.join('$');
    expect(await service.verify(password, reordered)).toBe(true);
    expect(service.needsRehash(reordered)).toBe(false);
  });

  it('rejects corrupt and unsupported hashes', async () => {
    for (const invalid of [
      '',
      'invalid',
      encoded.replace('argon2id', 'argon2i'),
      encoded + '!',
      encoded + '\n',
    ]) {
      expect(await service.verify(password, invalid)).toBe(false);
      expect(service.needsRehash(invalid)).toBe(true);
    }
  });

  it('rejects excessive work and duplicate PHC parameters before native verification', async () => {
    for (const invalid of [
      encoded.replace(/m=\d+/, 'm=999999999'),
      encoded.replace(/t=\d+/, 't=999999999'),
      encoded.replace(/p=\d+/, 'p=999999999'),
      encoded.replace(/p=\d+/, 'm=65536'),
    ]) {
      expect(await service.verify(password, invalid)).toBe(false);
    }
  });

  it('verifies older cost settings and reports the need to rehash without changing them', async () => {
    const older = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
    expect(await service.verify(password, older)).toBe(true);
    expect(service.needsRehash(older)).toBe(true);
  });

  it('validates configurable costs and accepts environment string values', async () => {
    const configured = new PasswordService(
      new ConfigService({
        PASSWORD_ARGON2_MEMORY_COST: '19456',
        PASSWORD_ARGON2_TIME_COST: '2',
        PASSWORD_ARGON2_PARALLELISM: '1',
      }),
    );
    const hash = await configured.hash(password);
    expect(configured.needsRehash(hash)).toBe(false);
    expect(service.needsRehash(hash)).toBe(true);
    for (const value of [null, '', 'invalid', '1.5', 0, 19_455, 262_145, true]) {
      expect(
        () => new PasswordService(new ConfigService({ PASSWORD_ARGON2_MEMORY_COST: value })),
      ).toThrow(RangeError);
    }
  });

  it('bounds input by UTF-8 bytes without truncation', async () => {
    const boundary = '📚'.repeat(256);
    const hash = await service.hash(boundary);
    expect(await service.verify(boundary, hash)).toBe(true);
    await expect(service.hash('')).rejects.toThrow(TypeError);
    await expect(service.hash(boundary + 'a')).rejects.toThrow(TypeError);
    expect(await service.verify(boundary + 'a', hash)).toBe(false);
    expect(await service.verify('', encoded)).toBe(false);
  });
});
