import jest from 'jest';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const { results } = await jest.runCLI(
  {
    runInBand: true,
    config: JSON.stringify({
      rootDir,
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/test/integration/banners.spec.ts',
        '<rootDir>/src/modules/banners/tests/*.spec.ts',
      ],
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
);
process.exitCode = results.success ? 0 : 1;
