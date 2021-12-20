module.exports = {
  globals: {
    $ref: 'readonly',
    $computed: 'readonly'
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
    webextensions: true,
    'vue/setup-compiler-macros': true
  },
  extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 12,
    parser: '@typescript-eslint/parser',
    sourceType: 'module'
  },
  ignorePatterns: 'dist/',
  plugins: ['vue', '@typescript-eslint'],
  rules: {
    '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
    // NOTICE: turn off setup props destructure warning
    // because new rfc suggests props destructure variable is also reactive
    // more details please refer to link
    // https://github.com/vuejs/rfcs/discussions/369
    'vue/no-setup-props-destructure': 'off'
  }
};
