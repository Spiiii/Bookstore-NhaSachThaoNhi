import globals from 'globals';
import base from './base.mjs';
import boundaries from './boundaries.mjs';

export default [
  ...base,
  boundaries,
  { files: ['**/*.{ts,tsx}'], languageOptions: { globals: globals.browser } },
];
