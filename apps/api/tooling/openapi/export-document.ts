import 'reflect-metadata';
import { writeFile } from 'node:fs/promises';
import { createDocument } from '../../src/openapi/create-document';
import { offlineAppBuilder } from './offline-providers';

/** Object key normalization preserves ordered arrays and removes no API semantics. */
export function stableJson(value: unknown): string {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize);
    if (item && typeof item === 'object')
      return Object.fromEntries(
        Object.entries(item)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([key, val]) => [key, normalize(val)]),
      );
    return item;
  };
  return JSON.stringify(normalize(value), null, 2) + '\n';
}
export async function exportDocument(): Promise<string> {
  const module = await offlineAppBuilder().compile();
  const app = module.createNestApplication({ logger: false });
  try {
    // Swagger scans compiled controller metadata; runtime init hooks (e.g. password warmup)
    // are unnecessary and must not execute during a schema-only export.
    return stableJson(createDocument(app));
  } finally {
    await app.close();
  }
}
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--output')
    throw new Error('Usage: export-document --output <file>');
  exportDocument()
    .then((json) => writeFile(args[1]!, json, 'utf8'))
    .catch((error: unknown) => {
      process.stderr.write(
        error instanceof Error ? error.message + '\n' : 'OpenAPI export failed.\n',
      );
      process.exitCode = 1;
    });
}
