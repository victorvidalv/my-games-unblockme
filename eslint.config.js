import globals from 'globals';

export default [
  { ignores: ['dist', 'node_modules', 'coverage'] },
  {
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser, __APP_VERSION__: 'readonly' } },
    rules: {
      'no-undef': 'error',
      'no-import-assign': 'error',
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
    },
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.js', 'vite.config.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node } },
    rules: { 'no-undef': 'error', 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }] },
  },
];
