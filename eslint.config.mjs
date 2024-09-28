import babelParser from '@babel/eslint-parser';
import importX from 'eslint-plugin-import-x';
import jsdoc from 'eslint-plugin-jsdoc';
import regexp from 'eslint-plugin-regexp';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import neostandard, { plugins as neostdplugins } from 'neostandard';

export default [
  {
    ignores: ['dist/', 'test/file/', 'test/wpt/', 'benchmark/']
  },
  jsdoc.configs['flat/recommended'],
  regexp.configs['flat/recommended'],
  ...neostandard({
    semi: true
  }),
  {
    plugins: {
      '@stylistic': neostdplugins['@stylistic'],
      'import-x': importX,
      regexp,
      unicorn
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.webextensions
      },
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          plugins: [
            '@babel/plugin-syntax-import-assertions'
          ]
        }
      },
      sourceType: 'module'
    },
    rules: {
      '@stylistic/space-before-function-paren': ['error', {
        anonymous: 'always',
        asyncArrow: 'always',
        named: 'never'
      }],
      'import-x/order': ['error', {
        alphabetize: {
          order: 'ignore',
          caseInsensitive: false
        }
      }],
      'no-await-in-loop': 'error',
      'no-use-before-define': ['error', {
        allowNamedExports: false,
        classes: true,
        functions: true,
        variables: true
      }],
      'unicorn/prefer-node-protocol': 'error'
    }
  }
];
