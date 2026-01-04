import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import reactNativePlugin from 'eslint-plugin-react-native'
import tanstackQueryPlugin from '@tanstack/eslint-plugin-query'
import prettierConfig from 'eslint-config-prettier'

export default [
	// Ignore patterns
	{
		ignores: [
			'node_modules/**',
			'android/**',
			'ios/**',
			'*.bundle.js',
			'*.bundle.map',
			'docs/**',
			'coverage/**',
			'build/**',
			'dist/**',
		],
	},

	// Base recommended configs
	js.configs.recommended,

	// TypeScript and React configuration for source files
	{
		files: ['source/**/*.{js,jsx,ts,tsx}', 'modules/**/*.{js,jsx,ts,tsx}', 'images/**/*.{ts,tsx}'],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: './tsconfig.json',
				ecmaVersion: 'latest',
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				__DEV__: 'readonly',
				fetch: 'readonly',
				FormData: 'readonly',
				console: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
				requestAnimationFrame: 'readonly',
				cancelAnimationFrame: 'readonly',
				JSX: 'readonly',
				process: 'readonly',
				React: 'readonly',
				NodeJS: 'readonly',
				require: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': tseslint.plugin,
			react: reactPlugin,
			'react-hooks': reactHooksPlugin,
			'react-native': reactNativePlugin,
			'@tanstack/query': tanstackQueryPlugin,
		},
		settings: {
			react: {
				version: '16.6',
			},
		},
		rules: {
			// TypeScript recommended rules
			...tseslint.configs.recommended.rules,
			// React recommended rules
			...reactPlugin.configs.recommended.rules,
			// TanStack Query recommended rules
			...tanstackQueryPlugin.configs.recommended.rules,

			// Custom rules from original config
			'array-callback-return': 'error',
			camelcase: 'warn',
			'consistent-this': ['error', 'self'],
			curly: ['warn', 'multi-line'],
			'default-case': 'error',
			'guard-for-in': 'error',
			eqeqeq: ['error', 'smart'],
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
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					args: 'after-used',
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'no-useless-constructor': 'error',
			'no-var': 'error',
			'prefer-const': 'off',
			'prefer-promise-reject-errors': 'error',
			'prefer-spread': 'error',
			quotes: ['warn', 'single', 'avoid-escape'],
			'require-await': 'warn',
			semi: 'off',
			'no-misleading-character-class': 'warn',
			'require-atomic-updates': 'error',
			'no-async-promise-executor': 'error',
			'require-unicode-regexp': 'error',

			// React rules
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

			// React hooks rules
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',

			// TypeScript rules
			'@typescript-eslint/explicit-module-boundary-types': 'warn',
			'@typescript-eslint/no-empty-function': 'warn',
		},
	},

	// Test files configuration
	{
		files: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
		languageOptions: {
			globals: {
				// Jest globals
				describe: 'readonly',
				it: 'readonly',
				test: 'readonly',
				expect: 'readonly',
				jest: 'readonly',
				beforeAll: 'readonly',
				afterAll: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
				xdescribe: 'readonly',
				xit: 'readonly',
				xtest: 'readonly',
			},
		},
	},

	// Scripts directory configuration
	{
		files: ['scripts/**/*.{js,mjs}'],
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'module',
			globals: {
				console: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				require: 'readonly',
				module: 'readonly',
				exports: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
			},
		},
		rules: {
			'@typescript-eslint/no-var-requires': 'off',
			'array-callback-return': 'error',
			camelcase: 'warn',
			'consistent-this': ['error', 'self'],
			curly: ['warn', 'multi-line'],
			'default-case': 'error',
			'guard-for-in': 'error',
			eqeqeq: ['error', 'smart'],
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
			'no-unused-vars': [
				'warn',
				{
					args: 'after-used',
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'no-useless-constructor': 'error',
			'no-var': 'error',
			'prefer-promise-reject-errors': 'error',
			'prefer-spread': 'error',
			quotes: ['warn', 'single', 'avoid-escape'],
			'require-await': 'warn',
			semi: 'off',
			'no-misleading-character-class': 'warn',
			'require-atomic-updates': 'error',
			'no-async-promise-executor': 'error',
			'require-unicode-regexp': 'error',
		},
	},

	// Prettier config (should be last to override other formatting rules)
	prettierConfig,
]
