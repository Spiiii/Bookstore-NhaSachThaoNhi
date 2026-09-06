import { ESLint } from 'eslint';
import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import base from '@bookstore/eslint-config/base';
import boundaries from '@bookstore/eslint-config/boundaries';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function boundaryLinter() {
  const parser = base.find((config) => config.languageOptions?.parser)?.languageOptions.parser;
  if (!parser) throw new Error('TypeScript boundary parser is unavailable.');
  return new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.{ts,tsx,mts,cts,js,mjs,cjs}'],
        languageOptions: {
          parser,
          parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            ecmaFeatures: { jsx: true },
          },
        },
      },
      boundaries,
    ],
  });
}
export function validateContractManifest(contracts, api) {
  for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies'])
    if (Object.keys(contracts[field] ?? {}).length)
      throw new Error(`Contracts cannot declare ${field}; source must be self-contained types.`);
  if (
    JSON.stringify(contracts.exports) !== JSON.stringify({ '.': { types: './src/index.ts' } }) ||
    contracts.types !== './src/index.ts' ||
    contracts.main ||
    contracts.module ||
    contracts.bin
  )
    throw new Error('Contracts must expose only the approved type-only root entry.');
  for (const field of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    for (const [name, version] of Object.entries(api[field] ?? {}))
      if (
        name === '@bookstore/contracts' ||
        /(?:@bookstore\/contracts|packages\/contracts)/.test(String(version))
      )
        throw new Error('API cannot depend on generated contracts.');
    for (const name of Object.keys(contracts[field] ?? {}))
      if (/^(?:@prisma\/|prisma$|pg$|@nestjs\/)/.test(name))
        throw new Error('Contracts cannot depend on Prisma or backend packages.');
  }
}
export async function checkContractBoundaries() {
  const manifest = async (path) => JSON.parse(await readFile(join(root, path), 'utf8'));
  validateContractManifest(
    await manifest('packages/contracts/package.json'),
    await manifest('apps/api/package.json'),
  );
  const files = [];
  async function scan(relative) {
    if (relative === 'apps/api/src/generated') return;
    for (const entry of await readdir(join(root, relative), { withFileTypes: true })) {
      if (entry.isSymbolicLink())
        throw new Error('Unexpected symlink in boundary scan: ' + relative + '/' + entry.name);
      const path = relative + '/' + entry.name;
      if (entry.isDirectory()) await scan(path);
      else if (/\.[cm]?[jt]sx?$/.test(entry.name)) files.push(join(root, path));
    }
  }
  for (const path of [
    'apps/api/src',
    'apps/api/tooling',
    'apps/api/operations',
    'apps/web/src',
    'packages/contracts/src',
  ])
    await scan(path);
  const eslint = boundaryLinter();
  const results = await eslint.lintFiles(files);
  if (results.some((result) => result.errorCount || result.warningCount))
    throw new Error(await (await eslint.loadFormatter('stylish')).format(results));
  process.stdout.write(
    'API/OpenAPI/contracts dependency boundaries verified (including generated contracts).\n',
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  checkContractBoundaries().catch((error) => {
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
  });
