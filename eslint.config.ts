import { fileURLToPath } from 'node:url';
import babelParser from '@babel/eslint-parser';
import importX from 'eslint-plugin-import-x';
import oxlint from 'eslint-plugin-oxlint';
import { createOxcImportResolver } from 'eslint-import-resolver-oxc';

/**
 * This ESLint config exists for ONE reason: enforcing the architecture layer
 * boundaries (`import-x/no-restricted-paths`), which oxlint's native import
 * plugin does not support. Every other rule lives in oxlint. `eslint-plugin-oxlint`
 * is appended to switch off any rule oxlint already owns, so nothing runs twice.
 *
 * Dependency direction (a layer may only import same/lower layers):
 *   app -> pages -> features -> entities -> shared
 */
const tsconfigPath = fileURLToPath(new URL('./tsconfig.app.json', import.meta.url));

const layerZones = [
  {
    target: './src/shared',
    from: ['./src/app', './src/pages', './src/features', './src/entities'],
    message: 'shared may not import from app/pages/features/entities (it is the lowest layer).',
  },
  {
    target: './src/entities',
    from: ['./src/app', './src/pages', './src/features'],
    message: 'entities may only import from entities/shared.',
  },
  {
    target: './src/features',
    from: ['./src/app', './src/pages'],
    message: 'features may only import from features/entities/shared.',
  },
  {
    target: './src/pages',
    from: ['./src/app'],
    message: 'pages may not import from app.',
  },
];

export default [
  {
    ignores: [
      'dist/**',
      'dist-server/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'node_modules/**',
      'src/routeTree.gen.ts',
      'public/mockServiceWorker.js',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        // The boundary rule only needs a syntactically valid ESTree AST, so we
        // enable the TS + JSX parser plugins directly rather than resolving a
        // Babel preset (Babel 8's eslint-parser does not derive them from presets).
        babelOptions: {
          babelrc: false,
          configFile: false,
          parserOpts: { plugins: ['typescript', 'jsx'] },
        },
      },
    },
    plugins: { 'import-x': importX },
    settings: {
      'import-x/resolver-next': [
        createOxcImportResolver({
          tsconfig: { configFile: tsconfigPath, references: 'auto' },
        }),
      ],
    },
    rules: {
      'import-x/no-restricted-paths': ['error', { zones: layerZones }],
    },
  },
  // Turn off any ESLint rule that oxlint already reports, based on .oxlintrc.json.
  ...oxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
];
