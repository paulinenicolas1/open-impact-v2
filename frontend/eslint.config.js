import storybook from 'eslint-plugin-storybook';
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...storybook.configs['flat/recommended'],
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json', './tsconfig.test.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: prettier,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  eslintConfigPrettier,
  // Storybook configuration files
  {
    files: ['.storybook/**/*'],
    rules: {
      'storybook/story-exports': 'off',
      'storybook/default-exports': 'off',
    },
  },
  // Story files (.stories.tsx) - Enforce Storybook best practices
  {
    files: ['**/*.stories.tsx', '**/*.stories.ts'],
    rules: {
      // These rules SHOULD be enforced for story files
      'storybook/use-storybook-testing-library': 'error', // Enforce @storybook/test in stories
      'storybook/use-storybook-expect': 'error', // Enforce expect from @storybook/test
    },
  },
  // Unit test files (.test.tsx) - Disable Storybook rules
  {
    files: ['**/*.test.tsx', '**/*.test.ts', 'vitest.setup.ts'],
    rules: {
      'storybook/story-exports': 'off',
      'storybook/default-exports': 'off',
      'storybook/use-storybook-expect': 'off',
      'storybook/use-storybook-testing-library': 'off', // Allow @testing-library/react
    },
  },
);
