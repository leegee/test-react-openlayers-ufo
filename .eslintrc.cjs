module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    // 'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    // plugin:@typescript-eslint/stylistic-type-checked,
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:react/jsx-runtime',
  ],
  ignorePatterns: [ 'dist', '.eslintrc.cjs' ],
  parser: '@typescript-eslint/parser',
  plugins: [ 'react-refresh' ],
  rules: {
    '@typescript-eslint/no-confusing-void-expression': 'off',
    'react-refresh/only-export-components': [
      'warn',
      {
        allowConstantExport: true
      }
    ],
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: [ './packages/client/tsconfig.json', './packages/client/tsconfig.node.json' ],
    tsconfigRootDir: __dirname,
  },
}
