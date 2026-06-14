import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

// Flat config for ESLint 9 (the repo was on the legacy .eslintrc format, which
// ESLint 9 no longer reads, so `npm run lint` errored out before this existed).
export default [
  {
    ignores: [
      'dist/**',
      'dist-examples/**',
      'coverage/**',
      'node_modules/**',
      'examples/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // TypeScript resolves globals/DOM lib types itself, and core `no-undef`
      // misfires on type-only names (RequestInit, HTMLElementTagNameMap, ...).
      // typescript-eslint recommends turning it off on TS files.
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // Tests reach into internals and cast through `unknown`/`any` freely.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
