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
    'react-refresh/only-export-components': 'off',
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: [ './tsconfig.json', './tsconfig.node.json' ],
    tsconfigRootDir: __dirname,
  },
}
