import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import reactNative from '@react-native/eslint-config'
import react from 'eslint-plugin-react'
import reactNativePlugin from 'eslint-plugin-react-native'
import reactHooks from 'eslint-plugin-react-hooks'
import tanstackQuery from '@tanstack/eslint-plugin-query'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
	// Ignore patterns (replaces .eslintignore)
	{
		ignores: [
			'**/*{.,-}min.js',
			'node_modules/',
		],
	},
	// Apply to all JS/TS files (without type-aware rules)
	{
		files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				// ES6 globals
				console: 'readonly',
				Promise: 'readonly',
				Set: 'readonly',
				Map: 'readonly',
				Symbol: 'readonly',
				WeakMap: 'readonly',
				WeakSet: 'readonly',
				Proxy: 'readonly',
				Reflect: 'readonly',
				ArrayBuffer: 'readonly',
				DataView: 'readonly',
				Int8Array: 'readonly',
				Uint8Array: 'readonly',
				Uint8ClampedArray: 'readonly',
				Int16Array: 'readonly',
				Uint16Array: 'readonly',
				Int32Array: 'readonly',
				Uint32Array: 'readonly',
				Float32Array: 'readonly',
				Float64Array: 'readonly',
				// Node.js globals
				__dirname: 'readonly',
				__filename: 'readonly',
				Buffer: 'readonly',
				global: 'readonly',
				process: 'readonly',
				require: 'readonly',
				module: 'readonly',
				exports: 'readonly',
				NodeJS: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
				// Browser/Web APIs
				URL: 'readonly',
				URLSearchParams: 'readonly',
				Response: 'readonly',
				Headers: 'readonly',
				// React Native globals
				fetch: 'readonly',
				FormData: 'readonly',
				navigator: 'readonly',
				window: 'readonly',
				document: 'readonly',
				XMLHttpRequest: 'readonly',
				WebSocket: 'readonly',
				requestAnimationFrame: 'readonly',
				cancelAnimationFrame: 'readonly',
				setImmediate: 'readonly',
				clearImmediate: 'readonly',
				// TypeScript/JSX globals
				JSX: 'readonly',
				React: 'readonly',
				// Test globals (Jest)
				describe: 'readonly',
				xdescribe: 'readonly',
				it: 'readonly',
				expect: 'readonly',
				jest: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
				beforeAll: 'readonly',
				afterAll: 'readonly',
				test: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
			'react': react,
			'react-native': reactNativePlugin,
			'react-hooks': reactHooks,
			'@tanstack/query': tanstackQuery,
		},
		settings: {
			react: {
				version: '16.6',
			},
		},
		rules: {
			// ESLint recommended rules
			...js.configs.recommended.rules,
			
			// TypeScript rules
			...tseslint.configs.recommended.rules,
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					args: 'after-used',
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/explicit-module-boundary-types': 'warn',
			'@typescript-eslint/no-empty-function': 'warn',
			
			// React rules
			...react.configs.recommended.rules,
			'react/display-name': 'off',
			'react/jsx-curly-brace-presence': ['warn', 'never'],
			'react/jsx-key': 'warn',
			'react/jsx-no-bind': [
				'warn',
				{
					ignoreRefs: true,
					allowArrowFunctions: true,
				},
			],
			'react/jsx-sort-props': [
				'warn',
				{
					reservedFirst: true,
					ignoreCase: false,
				},
			],
			'react/no-access-state-in-setstate': 'error',
			'react/no-did-mount-set-state': 'error',
			'react/no-did-update-set-state': 'error',
			'react/no-multi-comp': 'off',
			'react/no-redundant-should-component-update': 'warn',
			'react/no-typos': 'error',
			'react/prop-types': 'off',
			'react/self-closing-comp': 'warn',
			'react/sort-comp': [
				'warn',
				{
					order: [
						'static-variables',
						'static-methods',
						'type-annotations',
						'lifecycle',
						'everything-else',
						'render',
					],
				},
			],
			'react/sort-prop-types': 'warn',
			'react/wrap-multilines': 'off',
			'react/jsx-boolean-value': ['error', 'always'],
			
			// React Native rules
			'react-native/no-unused-styles': 'warn',
			'react-native/no-inline-styles': 'warn',
			'react-native/no-color-literals': 'warn',
			
			// React Hooks rules
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			
			// TanStack Query rules
			...tanstackQuery.configs.recommended.rules,
			
			// General rules
			'array-callback-return': 'error',
			'camelcase': 'warn',
			'consistent-this': ['error', 'self'],
			'curly': ['warn', 'multi-line'],
			'default-case': 'error',
			'guard-for-in': 'error',
			'eqeqeq': ['error', 'smart'],
			'linebreak-style': ['error', 'unix'],
			'new-cap': 'off',
			'no-await-in-loop': 'warn',
			'no-case-declarations': 'error',
			'no-console': 'off',
			'no-div-regex': 'error',
			'no-extra-label': 'error',
			'no-implicit-coercion': [
				'error',
				{
					boolean: true,
					number: true,
					string: true,
				},
			],
			'no-implicit-globals': 'error',
			'no-multi-assign': 'error',
			'no-new-symbol': 'error',
			'no-restricted-syntax': ['error', 'WithStatement'],
			'no-return-await': 'error',
			'no-throw-literal': 'error',
			'no-undef-init': 'off',
			'no-underscore-dangle': 'off',
			'no-unmodified-loop-condition': 'error',
			'no-unused-vars': 'off',
			'no-useless-constructor': 'error',
			'no-var': 'error',
			'prefer-const': 'off',
			'prefer-promise-reject-errors': 'error',
			'prefer-spread': 'error',
			'quotes': ['warn', 'single', 'avoid-escape'],
			'require-await': 'warn',
			'semi': 'off',
			'no-misleading-character-class': 'warn',
			'require-atomic-updates': 'error',
			'no-async-promise-executor': 'error',
			'require-unicode-regexp': 'error',
		},
	},
	// Apply Prettier config to disable conflicting rules
	eslintConfigPrettier,
]
