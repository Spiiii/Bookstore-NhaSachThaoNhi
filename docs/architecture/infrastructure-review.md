# Infrastructure review — patches

Scope: Prisma, Storage, Password; dependency direction, module isolation and config loading. Database Design R2 and Blueprint B3 ownership are unchanged.

## Findings and patches

1. **High: async configuration initialization race.** Reproduced with Nest config 3.3.0: importing plain ConfigModule inside infrastructure while a sibling ConfigModule.forRoot loads an async factory can construct providers before its values are merged. Storage failed with missing STORAGE_LOCAL_ROOT; password costs can silently fall back to defaults. All three modules now expose withConfig(ConfigService | Promise<ConfigService>), using a module-local asynchronous provider that Nest awaits before creating dependent services. No global infrastructure module is introduced.
2. **Medium: weak Prisma URL validation.** A nonempty non-PostgreSQL URL previously reached the driver. Construction now checks the URL syntax, PostgreSQL scheme and hostname before creating the adapter. Validation errors exclude the original value and parser cause to avoid exposing credentials.
3. **Medium: storage root validation.** Windows drive-relative rooted paths such as backslash-storage passed isAbsolute but depended on the current drive. Those paths and null bytes are now rejected before filesystem I/O.
4. **Medium: dependency direction was not enforced inside API infrastructure.** Existing imports are correctly isolated, but ESLint allowed infrastructure to import business modules, sibling persistence/storage/password implementations and JWT/HTTP packages. Boundary rules now reject these dependencies, including direct generated Prisma imports outside Prisma infrastructure.

## Config loading contract

Plain PrismaModule, StorageModule and PasswordModule remain supported when the process environment is provisioned before Nest starts, or configuration values are already synchronously available. Importing plain ConfigModule does not load a .env file. Never assume a sibling async ConfigModule.forRoot load has completed.

For async secret/config loading, the composition root validates a complete configuration snapshot and passes the same promise to all required modules:

```typescript
const config: Promise<ConfigService> = loadValidatedSettings().then(
  (settings) => new ConfigService(settings),
);

// Within the runtime or operational composition root:
imports: [
  PrismaModule.withConfig(config),
  StorageModule.withConfig(config),
  PasswordModule.withConfig(config),
];
```

This is a composition example, not an implemented loader. withConfig does not fetch secrets, load .env files, validate unrelated business settings or modify process.env. Supply every required setting explicitly: ConfigService itself can still fall back to process.env for absent keys. Runtime/setup/recovery must use separate process contexts and credentials; withConfig is not a database-privilege boundary. A context must import each infrastructure module once, choosing either the plain or configured form, not both.

ConfigService is deliberately not re-exported by these modules. Prisma exports only PrismaService, Storage only STORAGE_ADAPTER, Password only PasswordService. Constructors do not connect or touch storage. Prisma connects at Nest initialization; context shutdown disconnects. Offline tooling must still override PrismaService and STORAGE_ADAPTER before initialization/use.

## Remaining integration work

AppModule, runtime bootstrap and operational entry points are still scaffolds. They must wire the appropriate config loading, shutdown hooks and credentials in their implementation step. This review does not claim a deployed runtime or completed secret provisioning. Prisma SQL CHECK constraints and DB grants remain pending as documented in prisma-layer.md; no schema or database changes are included.

## Verification

Regression tests cover async configuration delivery, module exports/isolation, lifecycle delegation with stubbed database connections, rejected config promises, URL redaction and storage path validation. Existing Password and Storage tests are also rerun. ESLint boundary probes exercise both forbidden imports and allowed dependency direction.

Results: 24 tests across three suites passed; 12 dependency-direction probes passed; API typecheck/build and focused ESLint passed. No live database connection was made. The existing empty Jest scaffold config was not expanded; the isolated runner used the following configuration from apps/api:

```powershell
@'
const { runCLI } = require('jest');
runCLI({ runInBand: true, config: JSON.stringify({
  rootDir: process.cwd(), testEnvironment: 'node',
  testMatch: [
    '<rootDir>/test/integration/infrastructure.spec.ts',
    '<rootDir>/test/integration/password.spec.ts',
    '<rootDir>/test/integration/storage.spec.ts',
  ],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: {
    target: 'ES2022', module: 'CommonJS', moduleResolution: 'Node',
    experimentalDecorators: true, emitDecoratorMetadata: true,
    esModuleInterop: true, strict: true, skipLibCheck: true,
    types: ['node', 'jest'],
  } }] },
}) }, [process.cwd()]).then(({ results }) => {
  process.exitCode = results.success ? 0 : 1;
});
'@ | node
```

The mapper is needed when Jest reads generated Prisma TypeScript whose relative imports use .js extensions. Production CJS output already resolves those files normally; the generated client was not edited.
