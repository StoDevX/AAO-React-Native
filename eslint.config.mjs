// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.strictTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		rules: {
			'prefer-const': 'off',
			'@typescript-eslint/strict-boolean-expressions': 'error',
			'@typescript-eslint/switch-exhaustiveness-check': 'error',
			'@typescript-eslint/explicit-module-boundary-types': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					args: 'all',
					argsIgnorePattern: '^_',
					caughtErrors: 'all',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],
		},
		languageOptions: {
			globals: {
				__DEV__: 'readonly',
				ErrorUtils: 'off',
				FormData: 'off',
				XMLHttpRequest: 'off',
				alert: 'off',
				cancelAnimationFrame: 'off',
				cancelIdleCallback: 'off',
				clearImmediate: 'off',
				fetch: 'off', //?
				navigator: 'off',
				process: 'off',
				requestAnimationFrame: 'off',
				requestIdleCallback: 'off',
				setImmediate: 'off',
				window: 'off',
				...globals['shared-node-browser'],
			},
		},
	},
)
