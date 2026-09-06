import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const normalize = (value) => value.replaceAll('\\', '/');
const publicEntries = {
  contracts: [''],
  ui: ['', '/client', '/styles'],
  'eslint-config': ['/base', '/nestjs', '/nextjs', '/library', '/boundaries'],
  'typescript-config': ['/base.json', '/nestjs.json', '/nextjs.json', '/library.json'],
};

const rule = {
  meta: {
    type: 'problem',
    schema: [],
    messages: { boundary: '{{reason}}' },
  },
  create(context) {
    const filename = context.filename;
    const owner = normalize(path.relative(root, filename));
    const sourceUnit = owner.split('/').slice(0, 2).join('/');
    function check(node) {
      const argument =
        node.source ?? node.arguments?.[0] ?? node.argument ?? node.moduleReference?.expression;
      const source = argument?.type === 'TSLiteralType' ? argument.literal : argument;
      if (!source || typeof source.value !== 'string') return;
      const specifier = source.value;
      const workspace = specifier.match(/^@bookstore\/([^/]+)(.*)$/);
      const target =
        specifier.startsWith('.') || path.isAbsolute(specifier)
          ? normalize(path.relative(root, path.resolve(path.dirname(filename), specifier)))
          : specifier.startsWith('@/') && owner.startsWith('apps/web/')
            ? `apps/web/src/${specifier.slice(2)}`
            : workspace
              ? `packages/${workspace[1]}${workspace[2]}`
              : '';
      const targetUnit = target.split('/').slice(0, 2).join('/');
      const fail = (reason) =>
        context.report({ node: source, messageId: 'boundary', data: { reason } });
      const typeOnly =
        node.type === 'TSImportType' ||
        node.importKind === 'type' ||
        node.exportKind === 'type' ||
        (node.specifiers?.length > 0 &&
          node.specifiers.every(
            (item) => item.importKind === 'type' || item.exportKind === 'type',
          ));
      if (/^packages\/contracts(?:\/|$)/.test(target) && !typeOnly)
        fail('Contracts are type-only; consumers must use import type or export type.');
      if (
        owner.startsWith('packages/contracts/src/') &&
        !target.startsWith('packages/contracts/src/')
      )
        fail(
          'Contracts source must be self-contained and cannot import external packages or application code.',
        );
      if (
        owner.startsWith('apps/api/tooling/openapi/') &&
        (/^(?:@prisma\/|prisma(?:\/|$)|pg(?:\/|$))/.test(specifier) ||
          target.startsWith('apps/api/src/generated/prisma/'))
      )
        fail(
          'OpenAPI tooling must override PrismaService, not import Prisma clients or database drivers directly.',
        );
      const infrastructure = owner.match(
        /^apps\/api\/src\/infrastructure\/(prisma|credentials|storage)\//,
      )?.[1];
      if (infrastructure) {
        if (/^apps\/api\/src\/(modules\/|bootstrap\/|app\.module(?:\.|$))/.test(target)) {
          fail('Infrastructure must not depend on business modules or application composition.');
        }
        const dependency = target.match(
          /^apps\/api\/src\/infrastructure\/(prisma|credentials|storage)\//,
        )?.[1];
        if (dependency && dependency !== infrastructure) {
          fail('Prisma, password and storage infrastructure must remain independent.');
        }
        if (
          /^(?:@nestjs\/(?:jwt|passport|platform-express|swagger|axios)(?:\/|$)|passport(?:-jwt)?$|axios$|multer$|express$|(?:node:)?https?$)/.test(
            specifier,
          )
        ) {
          fail('Infrastructure must not depend on JWT or HTTP adapters.');
        }
        if (
          infrastructure !== 'prisma' &&
          (/^(?:@prisma\/|prisma(?:\/|$)|pg(?:\/|$))/.test(specifier) ||
            target.startsWith('apps/api/src/generated/prisma/'))
        ) {
          fail('Only Prisma infrastructure may import the database client and adapter.');
        }
      }
      if (
        owner.includes('/src/') &&
        /^packages\/(eslint-config|typescript-config)(\/|$)/.test(target)
      ) {
        fail('Development configuration packages must not enter application or library source.');
      }
      if (workspace && !publicEntries[workspace[1]]?.includes(workspace[2])) {
        fail('Use only declared workspace package exports.');
      }
      if (target.startsWith('apps/') && sourceUnit !== targetUnit) {
        fail('Applications are private composition roots; do not import another application.');
      }
      if (
        specifier.startsWith('.') &&
        target.startsWith('packages/') &&
        sourceUnit !== targetUnit
      ) {
        fail('Import another package through its @bookstore public export.');
      }
      if (owner.startsWith('apps/api/') && /^packages\/(ui|contracts)(\/|$)/.test(target)) {
        fail('API owns OpenAPI generation and must not depend on UI or generated contracts.');
      }
      if (
        owner.startsWith('apps/web/') &&
        /^(?:@prisma\/|prisma(?:\/|$)|@nestjs\/|pg(?:\/|$))/.test(specifier)
      ) {
        fail('Web must access backend data through HTTP contracts, not backend infrastructure.');
      }
      if (owner.startsWith('apps/api/src/') && /^apps\/api\/(operations|tooling)\//.test(target)) {
        fail('Runtime source must not depend on operations or tooling.');
      }
      if (
        owner === 'packages/ui/src/index.ts' &&
        /packages\/ui\/src\/client(?:\.|$)/.test(target)
      ) {
        fail('The server-safe UI root must not re-export its client entry.');
      }
      const sourceFeature = owner.match(/^apps\/web\/src\/features\/([^/]+)\//)?.[1];
      const targetFeature = target.match(/^apps\/web\/src\/features\/([^/]+)\/(.*)$/);
      if (
        targetFeature &&
        sourceFeature !== targetFeature[1] &&
        !/^(?:client|server)(?:\.[jt]sx?)?$/.test(targetFeature[2])
      ) {
        fail('Consume another feature through its client or server entry point.');
      }
      if (
        owner.startsWith('apps/api/operations/') &&
        /apps\/api\/src\/(app\.module|modules\/(auth|security)\/|.*\.controller)/.test(target)
      ) {
        fail('Operations must use the minimal operational context.');
      }
      if (
        /^packages\/(ui|contracts)\/src\//.test(owner) &&
        /^(?:@nestjs\/|@prisma\/|prisma$|axios$|pg$)/.test(specifier)
      ) {
        fail('Shared UI and contracts must not depend on backend or HTTP infrastructure.');
      }
      if (owner.startsWith('packages/contracts/src/') && !typeOnly) {
        fail('Contracts exports and imports must be type-only.');
      }
      const client =
        /\.client\.[cm]?[jt]sx?$/.test(owner) ||
        context.sourceCode.ast.body.some((item) => item.directive === 'use client');
      if (
        client &&
        (/(?:\.server|\/server)(?:\.[cm]?[jt]sx?)?$/.test(specifier) ||
          /^(?:server-only|next\/headers|node:)/.test(specifier))
      ) {
        fail('Client modules must not import server-only entry points.');
      }
    }
    return {
      Program(node) {
        if (!owner.startsWith('packages/contracts/src/')) return;
        for (const statement of node.body) {
          const declaration =
            statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
          if (['TSInterfaceDeclaration', 'TSTypeAliasDeclaration'].includes(declaration?.type))
            continue;
          if (
            ['ImportDeclaration', 'ExportAllDeclaration', 'TSImportEqualsDeclaration'].includes(
              statement.type,
            )
          )
            continue;
          if (statement.type === 'ExportNamedDeclaration' && !statement.declaration) continue;
          if (statement.type === 'EmptyStatement') continue;
          context.report({
            node: statement,
            messageId: 'boundary',
            data: {
              reason:
                'Contracts may contain only type declarations and type-only imports/exports; no runtime code or enums.',
            },
          });
        }
      },
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
      TSImportType: check,
      TSImportEqualsDeclaration: check,
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'require') check(node);
      },
    };
  },
};

export default {
  plugins: { bookstore: { rules: { boundaries: rule } } },
  rules: { 'bookstore/boundaries': 'error' },
};
