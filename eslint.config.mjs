import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

// The root package owns Playwright, repo scripts and contract tooling.
// The client and server each lint themselves with their own config.
export default defineConfig([
  globalIgnores(['client/', 'server/', 'docs/', 'tests/output/']),
  {
    files: ['tests/**/*.ts', 'playwright.config.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      // Node for the specs and helpers; browser for the bodies passed to a locator's evaluate and evaluateAll.
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    files: ['scripts/**/*.mts', 'tools/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
