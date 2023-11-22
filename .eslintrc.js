module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/jsx-runtime'
  ],
  settings: {
    react: {
      version: 'detect',
    }
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    'indent': ['error', 2],
    'brace-style': ['error', '1tbs'],
    'linebreak-style': ['error','unix'],
    'quotes': ['error', 'single', {'allowTemplateLiterals': true}],
    'semi': ['error', 'never'],
    'spaced-comment': ['error', 'always'],
    'react/prop-types': 0,
    'no-unused-vars': 'off',
    'max-len': ['error', {'code': 120}],
    '@typescript-eslint/no-unused-vars': 'error',
    'react/no-unescaped-entities': [
      'error',
      {
        forbid: ['>', '}'],
      },
    ],
    '@typescript-eslint/ban-ts-comment': 'off'
  },
  globals: {
    'module': true,
    'document': true,
    'alert': true,
    'localStorage': true,
    'window': true,
    'DOMParser': true,
    'event': true,
    'XMLHttpRequest': true,
    'FormData': true,
    'JSX': true,
    'fetch': true,
    'jest': true,
    'test': true,
    'describe': true,
    'navigator': true,
    'ResizeObserver': true,
    'process': true,
    'console': true,
    'setTimeout': true,
    'clearTimeout': true,
    'args': true,

    'Document': true,
    'HTMLElement': true,
    'HTMLInputElement': true
  }
}