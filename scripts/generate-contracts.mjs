import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';
import { format } from 'prettier';
import prettierConfig from '../prettier.config.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const header = '/** Generated from the Bookstore OpenAPI snapshot. Do not edit manually. */\n';
const index =
  '// Public type-only entry point. Generated schema internals are not package exports.\nexport type { paths, components, operations, webhooks, $defs } from "./generated/schema";\n';
function run(script, args, cwd = root) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stdout + result.stderr);
}
export async function generateContracts({ check = false } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'bookstore-contracts-'));
  try {
    run(
      join(root, 'node_modules/typescript/bin/tsc'),
      ['-p', 'tsconfig.tooling.json'],
      join(root, 'apps/api'),
    );
    const temporary = join(dir, 'bookstore.openapi.json');
    run(join(root, 'apps/api/dist-tooling/tooling/openapi/export-document.js'), [
      '--output',
      temporary,
    ]);
    const snapshot = await readFile(temporary, 'utf8');
    const schema =
      header + astToString(await openapiTS(JSON.parse(snapshot), { alphabetize: true }));
    const outputs = new Map([
      [
        'packages/contracts/openapi/bookstore.openapi.json',
        await format(snapshot, { ...prettierConfig, parser: 'json' }),
      ],
      [
        'packages/contracts/src/generated/schema.ts',
        await format(schema, { ...prettierConfig, parser: 'typescript' }),
      ],
      [
        'packages/contracts/src/index.ts',
        await format(index, { ...prettierConfig, parser: 'typescript' }),
      ],
    ]);
    const drift = [];
    for (const [relative, content] of outputs) {
      const path = join(root, relative);
      if (check) {
        let existing;
        try {
          existing = await readFile(path, 'utf8');
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
        }
        if (existing !== content) drift.push(relative);
      } else await writeFile(path, content, 'utf8');
    }
    if (drift.length)
      throw new Error(
        'Generated contracts are stale:\n' +
          drift.join('\n') +
          '\nRun pnpm contracts:generate and review the output.',
      );
    process.stdout.write(
      check
        ? 'Contracts are reproducible and up to date.\n'
        : 'OpenAPI snapshot and TypeScript contracts generated.\n',
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length > 2)
    throw new Error('Use check-contracts.mjs for read-only drift checking.');
  generateContracts().catch((error) => {
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
  });
}
