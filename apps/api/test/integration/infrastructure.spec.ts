import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PasswordModule } from '../../src/infrastructure/credentials/password.module';
import { PasswordService } from '../../src/infrastructure/credentials/password.service';
import { PrismaModule } from '../../src/infrastructure/prisma/prisma.module';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { LocalStorageAdapter } from '../../src/infrastructure/storage/adapters/local-storage.adapter';
import { STORAGE_ADAPTER } from '../../src/infrastructure/storage/storage-adapter.interface';
import { StorageModule } from '../../src/infrastructure/storage/storage.module';

describe('Infrastructure configuration and isolation', () => {
  it('awaits an explicit asynchronous configuration before creating providers', async () => {
    const root = resolve('dist/async-config-no-io');
    const config = new Promise<ConfigService>((done) =>
      setTimeout(
        () =>
          done(
            new ConfigService({
              DATABASE_URL: 'postgresql://fixture:fixture@127.0.0.1:1/bookstore',
              STORAGE_LOCAL_ROOT: root,
              PASSWORD_ARGON2_MEMORY_COST: 19456,
              PASSWORD_ARGON2_TIME_COST: 2,
              PASSWORD_ARGON2_PARALLELISM: 1,
            }),
          ),
        20,
      ),
    );
    const context = await Test.createTestingModule({
      imports: [
        PrismaModule.withConfig(config),
        StorageModule.withConfig(config),
        PasswordModule.withConfig(config),
      ],
    }).compile();
    try {
      expect(context.get(STORAGE_ADAPTER)).toBeInstanceOf(LocalStorageAdapter);
      expect(existsSync(root)).toBe(false);
      const password = context.get(PasswordService);
      const hash = await password.hash('infrastructure fixture');
      expect(hash).toContain('m=19456');
      expect(hash).toMatch(/[,$]t=2[,$]/);

      const prisma = context.get(PrismaService);
      const connect = jest.spyOn(prisma, '$connect').mockResolvedValue(undefined);
      const disconnect = jest.spyOn(prisma, '$disconnect').mockResolvedValue(undefined);
      expect(connect).not.toHaveBeenCalled();
      await context.init();
      expect(connect).toHaveBeenCalledTimes(1);
      await context.close();
      expect(disconnect).toHaveBeenCalledTimes(1);
    } catch (error) {
      await context.close();
      throw error;
    }
  });

  it('does not require database or storage settings to compose PasswordModule', async () => {
    const context = await Test.createTestingModule({
      imports: [PasswordModule.withConfig(new ConfigService())],
    }).compile();
    try {
      expect(context.get(PasswordService)).toBeInstanceOf(PasswordService);
      expect(() => context.get(PrismaService)).toThrow();
      expect(() => context.get(STORAGE_ADAPTER)).toThrow();
    } finally {
      await context.close();
    }
  });

  it('keeps all three modules non-global and limits public exports', () => {
    for (const module of [PrismaModule, StorageModule, PasswordModule]) {
      expect(Reflect.getMetadata('__module:global__', module)).not.toBe(true);
      expect(Reflect.getMetadata('controllers', module) ?? []).toEqual([]);
    }
    expect(Reflect.getMetadata('exports', PrismaModule)).toEqual([PrismaService]);
    expect(Reflect.getMetadata('exports', StorageModule)).toEqual([STORAGE_ADAPTER]);
    expect(Reflect.getMetadata('exports', PasswordModule)).toEqual([PasswordService]);
  });

  it('propagates configuration failure without starting infrastructure', async () => {
    const config = Promise.resolve().then(() => {
      throw new Error('Configuration unavailable');
    });
    await expect(
      Test.createTestingModule({
        imports: [StorageModule.withConfig(config)],
      }).compile(),
    ).rejects.toThrow('Configuration unavailable');
  });

  it('rejects invalid database URLs before connecting without exposing their contents', () => {
    for (const url of [
      '',
      'not-a-url',
      'mysql://user:secret@localhost/bookstore',
      'postgresql://',
    ]) {
      try {
        new PrismaService(new ConfigService({ DATABASE_URL: url }));
        throw new Error('Expected validation failure');
      } catch (error) {
        expect(error).toBeInstanceOf(TypeError);
        expect((error as Error).message).toBe(
          'DATABASE_URL must be a valid PostgreSQL connection URL.',
        );
      }
    }
  });

  it('rejects null bytes and Windows paths that depend on the current drive', () => {
    const paths = [resolve('dist/storage') + '\0'];
    if (process.platform === 'win32') paths.push('\\storage', '/storage');
    for (const path of paths) {
      expect(
        () => new LocalStorageAdapter(new ConfigService({ STORAGE_LOCAL_ROOT: path })),
      ).toThrow(TypeError);
    }
  });
});
