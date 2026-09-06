import jest from 'jest';
import { fileURLToPath } from 'node:url';

const { runCLI } = jest;

const database = process.argv.includes('--postgres');
if (database && !process.env.TEST_POSTGRES_ADMIN_URL) {
  process.stderr.write('TEST_POSTGRES_ADMIN_URL is required. PostgreSQL tests were NOT run.\n');
  process.exitCode = 1;
} else {
  const rootDir = fileURLToPath(new URL('..', import.meta.url));
  const suites = database
    ? [
        'test/integration/singleton-admin.spec.ts',
        'test/integration/database-privileges.spec.ts',
        'test/integration/session-concurrency.spec.ts',
        'test/integration/product-images.spec.ts',
      ]
    : [
        'test/integration/auth.spec.ts',
        'test/integration/auth-rate-limit.spec.ts',
        'test/integration/security.spec.ts',
        'test/integration/operations.spec.ts',
        'test/integration/operations-cleanup.spec.ts',
        'src/modules/auth/tests/*.spec.ts',
        'src/modules/users/tests/*.spec.ts',
      ];
  runCLI(
    {
      runInBand: true,
      config: JSON.stringify({
        rootDir,
        testEnvironment: 'node',
        testMatch: suites.map((suite) => '<rootDir>/' + suite),
        moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
        transform: {
          '^.+\\.tsx?$': [
            'ts-jest',
            {
              tsconfig: {
                target: 'ES2022',
                module: 'CommonJS',
                moduleResolution: 'Node',
                experimentalDecorators: true,
                emitDecoratorMetadata: true,
                esModuleInterop: true,
                strict: true,
                skipLibCheck: true,
                types: ['node', 'jest'],
              },
            },
          ],
        },
      }),
    },
    [rootDir],
  ).then(({ results }) => {
    process.exitCode = results.success ? 0 : 1;
  });
}
