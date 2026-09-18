module.exports = {
  extends: ['./base.js'],
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  globals: {
    __DEV__: 'readonly',
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
