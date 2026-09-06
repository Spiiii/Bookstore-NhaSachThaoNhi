import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export const ignores = {
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/dist-operations/**',
    '**/dist-tooling/**',
    '**/.next/**',
    '**/coverage/**',
    '**/playwright-report/**',
    '**/test-results/**',
    '**/generated/**',
    '**/next-env.d.ts',
  ],
};

export default [
  ignores,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: globals.node },
    rules: { 'no-unused-vars': 'off' },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
  prettier,
];
