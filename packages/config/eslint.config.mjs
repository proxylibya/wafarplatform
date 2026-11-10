// Shared flat ESLint configuration for every workspace.
// The module boundaries are enforced here rather than by review: a module may
// import its own files, `@wafar/shared`, `@wafar/db`, and nothing from a peer
// module's internals (docs/architecture.md, Principle X).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/coverage/**',
      '**/*.min.js',
      '**/migrations/**',
      '**/vendor/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...vue.configs['flat/recommended'],
  {
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // TypeScript resolves names itself; the SFC compiler and Nuxt's
      // auto-imports are not visible to ESLint's scope analysis.
      'no-undef': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/modules/*/repository/*', '**/modules/*/service/*'],
              message:
                'Import a module through its service port, never through another module\'s internals (docs/architecture.md).',
            },
          ],
        },
      ],
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'error',
    },
  },
  {
    // Files outside a typed project (generator scripts, workspace tests) are
    // linted for syntax and style without the type-aware rules.
    files: [
      '**/*.mjs',
      '**/tests/**',
      '**/test/**',
      '**/*.config.*',
      '**/*.d.ts',
      'apps/web/server/**',
      'packages/config/**',
      'packages/db/scripts/**',
      'apps/api/src/cli/**',
    ],
    languageOptions: {
      parserOptions: { project: false, projectService: false },
    },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
    },
  },
  {
    // The composition root wires modules together, so it is the one place that
    // imports their internals; a test double is likewise not a module.
    files: [
      'apps/api/src/app.ts',
      'apps/api/src/index.ts',
      'apps/api/src/http/**',
      'apps/api/src/cli/**',
      '**/__tests__/**',
      '**/test/**',
    ],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
);
