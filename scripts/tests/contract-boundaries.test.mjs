import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { boundaryLinter, root, validateContractManifest } from '../check-contract-boundaries.mjs';

const eslint = boundaryLinter();
const cases = [
  [
    'API type import',
    'apps/api/src/probe.ts',
    "import type { paths } from '@bookstore/contracts';",
  ],
  [
    'API import type expression',
    'apps/api/src/probe.ts',
    "type Paths = import('@bookstore/contracts').paths;",
  ],
  [
    'API require assignment',
    'apps/api/src/probe.ts',
    "import contracts = require('@bookstore/contracts');",
  ],
  [
    'API dynamic import',
    'apps/api/src/probe.ts',
    "const contracts = import('@bookstore/contracts');",
  ],
  [
    'API absolute import',
    'apps/api/src/probe.ts',
    `import type { paths } from ${JSON.stringify(join(root, 'packages/contracts/src/index.ts'))};`,
  ],
  [
    'Prisma type expression',
    'packages/contracts/src/probe.ts',
    "type User = import('@prisma/client').User;",
  ],
  [
    'generated Prisma require',
    'packages/contracts/src/generated/probe.ts',
    "import prisma = require('@prisma/client');",
  ],
  [
    'generated runtime enum',
    'packages/contracts/src/generated/probe.ts',
    'export enum Role { ADMIN }',
  ],
  [
    'generated runtime constant',
    'packages/contracts/src/generated/probe.ts',
    'export const mode = 1;',
  ],
  [
    'web Prisma type expression',
    'apps/web/src/probe.ts',
    "type User = import('@prisma/client').User;",
  ],
  [
    'web runtime contracts',
    'apps/web/src/probe.ts',
    "import { paths } from '@bookstore/contracts';",
  ],
  ['tooling database driver', 'apps/api/tooling/openapi/probe.ts', "import { Client } from 'pg';"],
];
for (const [name, filePath, source] of cases)
  test('rejects ' + name, async () => {
    const [result] = await eslint.lintText(source, { filePath: join(root, filePath) });
    assert.ok(
      result.messages.some((message) => message.ruleId === 'bookstore/boundaries'),
      JSON.stringify(result.messages),
    );
  });
test('allows public type imports, generated interfaces and tooling override tokens', async () => {
  for (const [file, source] of [
    ['apps/web/src/probe.ts', "import type { paths } from '@bookstore/contracts';"],
    ['packages/contracts/src/index.ts', "export type { paths } from './generated/schema';"],
    [
      'packages/contracts/src/generated/probe.ts',
      'export interface paths {} export type User = {id:string};',
    ],
    [
      'apps/api/tooling/openapi/probe.ts',
      "import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';",
    ],
  ]) {
    const [result] = await eslint.lintText(source, { filePath: join(root, file) });
    assert.equal(result.errorCount, 0, JSON.stringify(result.messages));
  }
});
test('rejects manifest reverse dependencies and runtime entry points', () => {
  const contracts = { types: './src/index.ts', exports: { '.': { types: './src/index.ts' } } };
  assert.doesNotThrow(() => validateContractManifest(contracts, {}));
  assert.throws(() =>
    validateContractManifest(contracts, {
      dependencies: { '@bookstore/contracts': 'workspace:*' },
    }),
  );
  assert.throws(() =>
    validateContractManifest({ ...contracts, dependencies: { '@prisma/client': '1.0.0' } }, {}),
  );
  assert.throws(() => validateContractManifest({ ...contracts, main: './dist/index.js' }, {}));
});
