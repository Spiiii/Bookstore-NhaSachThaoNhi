# ADR 0002 — Reusable password hashing

Date: 2026-09-03. Status: implemented within the approved R2/B3 PasswordModule ownership.

## Decision

Use argon2 0.45.1, pinned in apps/api/package.json and the workspace lockfile. The library implements Argon2 hashing, PHC encoding and verification with timing-safe digest comparison. Use its Argon2id variant explicitly, version 19. No custom cryptographic primitive, Prisma, JWT, HTTP, account lookup or persistence belongs in this module.

PasswordModule imports ConfigModule and exports PasswordService, without global scope. Login, initial setup, recovery and password changes can import the same module in their respective composition roots. No account/session behavior is implemented here. Hashing must occur outside database transactions.

## Shared parameters

| ConfigService key           | Default            | Accepted range   |
| --------------------------- | ------------------ | ---------------- |
| PASSWORD_ARGON2_MEMORY_COST | 65536 KiB (64 MiB) | 19456–262144 KiB |
| PASSWORD_ARGON2_TIME_COST   | 3                  | 2–10             |
| PASSWORD_ARGON2_PARALLELISM | 1                  | 1–4              |

Values are validated once when the service is constructed. Undefined values use defaults; explicit invalid values fail startup without echoing their contents. Composition roots must supply the same settings to all consumers. Salt is a new cryptographically random 16-byte value for every hash; digest is 32 bytes. The resulting PHC string includes salt and parameters and fits User.passwordHash varchar(255).

The defaults exceed the OWASP Argon2id minimum of 19 MiB, two iterations and one lane. Deployment performance and concurrent hashing capacity still need measurement on the target host; login rate limiting belongs to the authentication boundary.

## Public API

- hash(password): Promise<string>. Nonempty UTF-8 input, at most 1024 bytes. Throws TypeError for invalid input; native hashing errors propagate. The byte ceiling is a resource bound, not a complexity/minimum-length password policy.
- verify(password, encodedHash): Promise<boolean>. Parameter order is plaintext first, stored hash second. Accepts Argon2id version 19; returns false for wrong passwords, invalid input, corrupt/unsupported hashes or native verification errors. PHC memory/time/parallelism are bounded before native work; earlier lower-cost Argon2id hashes can still verify.
- needsRehash(encodedHash): boolean. Checks current cost settings, version, salt and digest lengths. Invalid or unsupported encodings return true. This never authorizes a login or writes credentials. Callers may replace a hash only after successful verification, using the existing persistence/session rules.

Passwords are not trimmed, case-folded, normalized or truncated. Nothing logs plaintext, hashes or salts. No secret pepper or environment-dependent fallback algorithm is introduced.

## Validation and dependency installation

Native Argon2 tests cover isolated Nest dependency injection, random salts, PHC interoperability, Unicode/whitespace, parameter ordering, invalid/expensive encodings, rehash detection, configuration validation and UTF-8 limits. API build, focused ESLint and formatting checks also pass.

On the current Node 24.18.0 Windows host, the package's bundled native binary loads with pnpm lifecycle scripts disabled. This does not require broadening onlyBuiltDependencies. Other deployment targets must verify availability of a compatible bundled binary or explicitly configure a scoped native build.

The existing Jest scaffold config is still empty. To reproduce the nine focused tests, run this PowerShell command from apps/api using an isolated configuration:

```powershell
@'
const { runCLI } = require('jest');
runCLI({ runInBand: true, config: JSON.stringify({
  rootDir: process.cwd(), testEnvironment: 'node',
  testMatch: ['<rootDir>/test/integration/password.spec.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: {
      target: 'ES2022', module: 'CommonJS', moduleResolution: 'Node',
      experimentalDecorators: true, emitDecoratorMetadata: true,
      esModuleInterop: true, strict: true, skipLibCheck: true,
      types: ['node', 'jest'],
    } }],
  },
}) }, [process.cwd()]).then(({ results }) => {
  process.exitCode = results.success ? 0 : 1;
});
'@ | node
```

## Sources

- [node-argon2](https://github.com/ranisalt/node-argon2)
- [argon2 0.45.1 metadata](https://registry.npmjs.org/argon2/0.45.1)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
