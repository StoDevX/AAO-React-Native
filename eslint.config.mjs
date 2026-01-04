// @ts-check

import eslint from '@eslint/js'
import {defineConfig} from 'eslint/config'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import tanstackQuery from '@tanstack/eslint-plugin-query'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import globals from 'globals'

export default defineConfig([
	// Ignore patterns (replaces .eslintignore)
	{ignores: ['**/*.min.js', '**/*-min.js']},
	// base eslint rules
	eslint.configs.recommended,
	// @typescript-eslint
	tseslint.configs.recommendedTypeChecked,
	{languageOptions: {parserOptions: {projectService: true}}}, // enable projectService for faster linting
	// @tanstack/eslint-plugin-query
	...tanstackQuery.configs['flat/recommended'],
	// eslint-plugin-react-hooks
	reactHooks.configs.flat.recommended,
	// eslint-plugin-react
	{
		files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
		...reactPlugin.configs.flat.recommended,
	},
	// custom rule settings
	{
		files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
		settings: {react: {version: 'detect'}},
		languageOptions: {
			globals: {
				...globals.node,
				...globals.browser,
				...globals.es2021,
				// Additional TypeScript/JSX/React/Node globals
				JSX: 'readonly',
				React: 'readonly',
				NodeJS: 'readonly',
			},
		},
		rules: {
			// General rules
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
				{boolean: true, number: true, string: true},
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
			quotes: ['warn', 'single', 'avoid-escape'],
			'require-await': 'warn',
			semi: 'off',
			'no-misleading-character-class': 'warn',
			'require-atomic-updates': 'error',
			'no-async-promise-executor': 'error',
			'require-unicode-regexp': 'error',

			// TypeScript rules
			// TODO: replace no-unused-vars with the TS version, as it's already doing this work
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					args: 'after-used',
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/explicit-module-boundary-types': 'warn',
			'@typescript-eslint/no-inferrable-types': 'warn',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/no-require-imports': 'error',
			// TODO(rye): Follow-up: DENY these
			'@typescript-eslint/no-empty-function': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',

			// React Hooks rules
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			// React rules,
			'react/display-name': 'off',
			'react/jsx-curly-brace-presence': ['warn', 'never'],
			'react/jsx-key': 'warn',
			'react/jsx-no-bind': [
				'warn',
				{ignoreRefs: true, allowArrowFunctions: true},
			],
			'react/jsx-sort-props': [
				'warn',
				{reservedFirst: true, ignoreCase: false},
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
			'react/jsx-boolean-value': ['error', 'always'],
		},
	},
	// Allow require() for React Native image imports
	{
		files: ['images/**/*.ts'],
		rules: {
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
	// Eslint v9/ts-eslint v8 upgrade temporary overrides
	{
		files: ['**/*.{ts,tsx}'],
		rules: {
			'@typescript-eslint/no-misused-promises': 'off',
			'@typescript-eslint/restrict-template-expressions': 'off',
			'@typescript-eslint/no-floating-promises': 'off',
			'react-hooks/set-state-in-effect': 'off',
		},
	},
	// Apply Prettier config to disable conflicting rules
	eslintConfigPrettier,
])
