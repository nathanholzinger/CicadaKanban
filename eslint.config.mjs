import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

// The root package owns the Playwright specs and their config, and the repo scripts. The
// client and the server each lint themselves with their own config.
export default defineConfig([
  globalIgnores(['client/', 'server/', 'docs/', 'tests/output/']),
  {
    files: ['tests/**/*.ts', 'playwright.config.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      // Node for the specs and helpers; browser for the bodies passed to page.evaluate.
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    files: ['scripts/**/*.mts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
