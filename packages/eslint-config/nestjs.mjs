import base from './base.mjs';
import boundaries from './boundaries.mjs';

export default [
  ...base,
  boundaries,
  {
    files: ['**/*.ts'],
    rules: {
      // Nest constructor injection requires runtime class imports for decorator metadata.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
