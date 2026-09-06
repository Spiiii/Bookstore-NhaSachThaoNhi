import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { LocalStorageAdapter } from '../../src/infrastructure/storage/adapters/local-storage.adapter';
import {
  STORAGE_ADAPTER,
  type StorageAdapter,
} from '../../src/infrastructure/storage/storage-adapter.interface';
import { StorageModule } from '../../src/infrastructure/storage/storage.module';

describe('Local storage infrastructure', () => {
  const testBase = resolve('dist/storage-tests');
  let directory: string;
  let root: string;
  let adapter: LocalStorageAdapter;

  beforeEach(async () => {
    await mkdir(testBase, { recursive: true });
    directory = await mkdtemp(join(testBase, 'case-'));
    root = join(directory, 'objects');
    adapter = new LocalStorageAdapter(new ConfigService({ STORAGE_LOCAL_ROOT: root }));
  });

  afterEach(async () => {
    if (!directory) return;
    const child = relative(testBase, resolve(directory));
    if (!child || child.startsWith('..') || isAbsolute(child)) {
      throw new Error('Refusing cleanup outside the dedicated storage test directory.');
    }
    await rm(directory, { recursive: true, force: true });
  });

  it('resolves the public token without touching the filesystem during construction', async () => {
    const context = await Test.createTestingModule({ imports: [StorageModule] })
      .overrideProvider(ConfigService)
      .useValue(new ConfigService({ STORAGE_LOCAL_ROOT: root }))
      .compile();
    try {
      expect(context.get<StorageAdapter>(STORAGE_ADAPTER)).toBeInstanceOf(LocalStorageAdapter);
      expect(existsSync(root)).toBe(false);
    } finally {
      await context.close();
    }
  });

  it('round-trips binary bytes using an opaque key and reports the byte size', async () => {
    const bytes = Buffer.from([0, 1, 127, 128, 255]);
    const stored = await adapter.put(bytes);
    expect(stored.size).toBe(bytes.length);
    expect(stored.key).toMatch(/^[0-9a-f-]{36}$/);
    expect(await adapter.read(stored.key)).toEqual(bytes);
    expect(await readFile(join(root, stored.key))).toEqual(bytes);
  });

  it('snapshots input rather than persisting later mutations by the caller', async () => {
    const input = new Uint8Array([1, 2, 3]);
    const pending = adapter.put(input);
    input.fill(9);
    const stored = await pending;
    expect(await adapter.read(stored.key)).toEqual(Buffer.from([1, 2, 3]));
  });

  it('creates distinct keys for concurrent puts and supports empty objects', async () => {
    const objects = await Promise.all(
      Array.from({ length: 8 }, () => adapter.put(Buffer.alloc(0))),
    );
    expect(new Set(objects.map((object) => object.key)).size).toBe(8);
    for (const object of objects) {
      expect(object.size).toBe(0);
      expect(await adapter.read(object.key)).toEqual(Buffer.alloc(0));
    }
  });

  it('deletes idempotently while missing reads retain ENOENT', async () => {
    await expect(adapter.delete(randomUUID())).resolves.toBeUndefined();
    expect(existsSync(root)).toBe(false);
    const stored = await adapter.put(Buffer.from('fixture'));
    await adapter.delete(stored.key);
    await expect(adapter.delete(stored.key)).resolves.toBeUndefined();
    await expect(adapter.read(stored.key)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects traversal, absolute paths, alternate streams and malformed keys', async () => {
    const sentinel = join(directory, 'outside.txt');
    await writeFile(sentinel, 'unchanged');
    for (const key of [
      '',
      '../outside.txt',
      '..\\outside.txt',
      sentinel,
      '%2e%2e/outside.txt',
      randomUUID() + ':stream',
      randomUUID() + '\n',
    ]) {
      await expect(adapter.read(key)).rejects.toThrow(TypeError);
      await expect(adapter.delete(key)).rejects.toThrow(TypeError);
    }
    expect(await readFile(sentinel, 'utf8')).toBe('unchanged');
    expect(existsSync(root)).toBe(false);
  });

  it('rejects a symbolic-link root', async () => {
    const target = join(directory, 'target');
    await mkdir(target);
    await symlink(target, root, process.platform === 'win32' ? 'junction' : 'dir');
    await expect(adapter.put(Buffer.from('fixture'))).rejects.toThrow(/symbolic link/);
  });

  it('refuses directories and junctions/symlinks in object slots', async () => {
    await mkdir(root);
    const directoryKey = randomUUID();
    await mkdir(join(root, directoryKey));
    await expect(adapter.read(directoryKey)).rejects.toThrow(/regular file/);
    await expect(adapter.delete(directoryKey)).rejects.toThrow(/regular file/);

    const target = join(directory, 'target');
    await mkdir(target);
    await writeFile(join(target, 'sentinel'), 'unchanged');
    const linkKey = randomUUID();
    await symlink(target, join(root, linkKey), process.platform === 'win32' ? 'junction' : 'dir');
    await expect(adapter.read(linkKey)).rejects.toThrow(/regular file/);
    await expect(adapter.delete(linkKey)).rejects.toThrow(/regular file/);
    expect(await readFile(join(target, 'sentinel'), 'utf8')).toBe('unchanged');
  });

  it('requires an explicit dedicated absolute storage root', () => {
    expect(() => new LocalStorageAdapter(new ConfigService())).toThrow(/STORAGE_LOCAL_ROOT/);
    for (const invalid of ['', '.', 'relative/uploads', resolve('/')]) {
      expect(
        () => new LocalStorageAdapter(new ConfigService({ STORAGE_LOCAL_ROOT: invalid })),
      ).toThrow(TypeError);
    }
  });
});
