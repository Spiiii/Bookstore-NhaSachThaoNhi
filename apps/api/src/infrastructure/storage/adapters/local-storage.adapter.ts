import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { lstat, mkdir, open, realpath, unlink } from 'node:fs/promises';
import { isAbsolute, join, parse, resolve } from 'node:path';
import type { StorageAdapter, StoredObject } from '../storage-adapter.interface';

const OBJECT_KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  private readonly root: string;

  constructor(config: ConfigService) {
    const root = config.getOrThrow<string>('STORAGE_LOCAL_ROOT');
    if (
      typeof root !== 'string' ||
      root.trim().length === 0 ||
      root.includes('\0') ||
      !isAbsolute(root) ||
      (process.platform === 'win32' && /^[\\/]$/.test(parse(root).root))
    ) {
      throw new TypeError('STORAGE_LOCAL_ROOT must be an absolute directory path.');
    }
    this.root = resolve(root);
    if (this.root === parse(this.root).root) {
      throw new TypeError(
        'STORAGE_LOCAL_ROOT must be a dedicated directory, not a filesystem root.',
      );
    }
  }

  async put(data: Uint8Array): Promise<StoredObject> {
    if (!(data instanceof Uint8Array)) {
      throw new TypeError('Storage data must be a Uint8Array or Buffer.');
    }

    // Snapshot the input before awaiting filesystem work.
    const bytes = Buffer.from(data);
    const root = await this.getRoot(true);
    const key = randomUUID();
    const destination = join(root, key);
    // Exclusive creation refuses collisions and pre-existing symbolic links.
    const handle = await open(destination, 'wx', 0o600);
    try {
      await handle.writeFile(bytes);
      await handle.close();
    } catch (error) {
      await handle.close().catch(() => undefined);
      await unlink(destination).catch(() => undefined);
      throw error;
    }

    return { key, size: bytes.byteLength };
  }

  async read(key: string): Promise<Buffer> {
    this.assertKey(key);
    const destination = join(await this.getRoot(false), key);
    await this.assertRegularFile(destination);
    const handle = await open(destination, 'r');
    try {
      if (!(await handle.stat()).isFile()) {
        throw new Error('Storage object must be a regular file.');
      }
      return await handle.readFile();
    } finally {
      await handle.close();
    }
  }

  async delete(key: string): Promise<void> {
    this.assertKey(key);
    try {
      const destination = join(await this.getRoot(false), key);
      await this.assertRegularFile(destination);
      await unlink(destination);
    } catch (error) {
      if (!this.isMissing(error)) throw error;
    }
  }

  private assertKey(key: string): void {
    if (typeof key !== 'string' || key.length !== 36 || !OBJECT_KEY.test(key)) {
      throw new TypeError('Invalid local storage object key.');
    }
  }

  private async getRoot(create: boolean): Promise<string> {
    if (create) await mkdir(this.root, { recursive: true, mode: 0o700 });
    const entry = await lstat(this.root);
    if (entry.isSymbolicLink() || !entry.isDirectory()) {
      throw new Error('STORAGE_LOCAL_ROOT must be a directory and must not be a symbolic link.');
    }
    return realpath(this.root);
  }

  private async assertRegularFile(destination: string): Promise<void> {
    const entry = await lstat(destination);
    if (entry.isSymbolicLink() || !entry.isFile()) {
      throw new Error('Storage object must be a regular file, not a symbolic link or directory.');
    }
  }

  private isMissing(error: unknown): boolean {
    return (
      typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
    );
  }
}
