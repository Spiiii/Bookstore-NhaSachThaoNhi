import { mkdtemp, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cleanupMedia } from '../../operations/cleanup-media';

describe('Offline media cleanup', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'bookstore-cleanup-test-'));
    await writeFile(join(root, id), 'test');
  });
  afterEach(async () => {
    if (root && root.startsWith(join(tmpdir(), 'bookstore-cleanup-test-')))
      await rm(root, { recursive: true, force: true });
  });
  const options = () => ({
    root,
    apply: false,
    maintenanceConfirmed: false,
    now: Date.now() + 48 * 3600000,
    readReferences: async () => new Set<string>(),
    report: jest.fn(),
  });
  it('defaults to dry-run and retains recently created objects', async () => {
    const opts = options();
    await cleanupMedia(opts);
    expect(opts.report).toHaveBeenCalledWith({ key: id, action: 'candidate' });
    expect(await readdir(root)).toContain(id);
    opts.report.mockClear();
    await cleanupMedia({ ...opts, now: Date.now() });
    expect(opts.report).not.toHaveBeenCalled();
  });
  it('requires maintenance confirmation and preserves references', async () => {
    await expect(cleanupMedia({ ...options(), apply: true })).rejects.toThrow('Stop ALL');
    await cleanupMedia({
      ...options(),
      apply: true,
      maintenanceConfirmed: true,
      readReferences: async () => new Set([id]),
    });
    expect(await readdir(root)).toContain(id);
  });
  it('rechecks references immediately before deletion', async () => {
    const readReferences = jest
      .fn()
      .mockResolvedValueOnce(new Set())
      .mockResolvedValue(new Set([id]));
    await cleanupMedia({ ...options(), apply: true, maintenanceConfirmed: true, readReferences });
    expect(await readdir(root)).toContain(id);
  });
  it('deletes only old unreferenced UUID objects when explicitly applying', async () => {
    await writeFile(join(root, 'unmanaged.txt'), 'keep');
    await cleanupMedia({ ...options(), apply: true, maintenanceConfirmed: true });
    expect(await readdir(root)).toEqual(['unmanaged.txt']);
  });
});
