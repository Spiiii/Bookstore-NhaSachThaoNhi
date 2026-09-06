import { lstat, readdir, realpath, unlink } from 'node:fs/promises';
import { isAbsolute, join, parse, resolve } from 'node:path';
import { Client } from 'pg';

const KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const REFERENCES = `SELECT storage_key AS key FROM public.product_images
  UNION SELECT logo_key FROM public.brands WHERE logo_key IS NOT NULL
  UNION SELECT cover_key FROM public.news WHERE cover_key IS NOT NULL
  UNION SELECT image_key FROM public.banners`;

export interface CleanupOptions {
  root: string;
  apply: boolean;
  maintenanceConfirmed: boolean;
  readReferences: () => Promise<Set<string>>;
  report: (event: { key: string; action: string }) => void;
  now?: number;
}

/** Maintenance-only deletion. No content modules, HTTP server or DB writes. */
export async function cleanupMedia(options: CleanupOptions): Promise<void> {
  if (options.apply && !options.maintenanceConfirmed)
    throw new Error('Stop ALL upload/content/import writers, then pass --maintenance-confirmed.');
  const absolute = resolve(options.root);
  if (!isAbsolute(options.root) || absolute === parse(absolute).root)
    throw new Error('A dedicated absolute storage directory is required.');
  const entry = await lstat(absolute);
  if (!entry.isDirectory() || entry.isSymbolicLink())
    throw new Error('Storage root must be a real directory.');
  const root = await realpath(absolute);
  const cutoff = (options.now ?? Date.now()) - 24 * 60 * 60 * 1000;
  const references = await options.readReferences();
  for (const name of await readdir(root)) {
    if (!KEY.test(name)) continue;
    const path = join(root, name);
    const stat = await lstat(path);
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      stat.mtimeMs >= cutoff ||
      stat.ctimeMs >= cutoff ||
      references.has(name)
    )
      continue;
    if (!options.apply) {
      options.report({ key: name, action: 'candidate' });
      continue;
    }
    // Recheck both database references and the exact file before deletion. Maintenance is mandatory.
    if ((await options.readReferences()).has(name)) continue;
    const current = await lstat(path);
    if (
      !current.isFile() ||
      current.isSymbolicLink() ||
      current.ino !== stat.ino ||
      current.dev !== stat.dev ||
      current.size !== stat.size ||
      current.mtimeMs !== stat.mtimeMs ||
      current.ctimeMs !== stat.ctimeMs
    )
      throw new Error(`File changed during cleanup: ${name}`);
    await unlink(path);
    options.report({ key: name, action: 'deleted' });
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--apply', '--maintenance-confirmed'].includes(arg)))
    throw new Error('Unsupported cleanup argument.');
  const connectionString = process.env.CLEANUP_DATABASE_URL;
  const root = process.env.STORAGE_LOCAL_ROOT;
  if (!connectionString || !root)
    throw new Error('CLEANUP_DATABASE_URL and STORAGE_LOCAL_ROOT are required.');
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
  });
  try {
    await client.connect();
    await client.query('SET default_transaction_read_only = on');
    await cleanupMedia({
      root,
      apply: args.includes('--apply'),
      maintenanceConfirmed: args.includes('--maintenance-confirmed'),
      readReferences: async () =>
        new Set((await client.query<{ key: string }>(REFERENCES)).rows.map((row) => row.key)),
      report: (event) => process.stdout.write(JSON.stringify(event) + '\n'),
    });
  } finally {
    await client.end();
  }
}
if (require.main === module)
  main().catch(() => {
    process.stderr.write(
      'Media cleanup failed. Check configuration, maintenance prerequisites and filesystem/database access. No automatic retry.\n',
    );
    process.exitCode = 1;
  });
