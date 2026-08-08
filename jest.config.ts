import type {Config} from 'jest'

// Packages that ship as ESM-only and need Babel transformation for Jest
const esmPackages = [
	'(jest-)?react-native',
	'@react-native',
	'@frogpond',
	'glamorous-native',
	'react-navigation',
	'@reduxjs/toolkit',
	'immer',
	'redux',
	'redux-thunk',
	'reselect',
	'expo',
	'@expo',
	// css-select v7+ and its ESM-only transitive deps
	'css-select',
	'boolbase',
	'css-what',
	'nth-check',
	'domhandler',
	'domutils',
	'dom-serializer',
	'domelementtype',
	'entities',
	'htmlparser2',
]

const config: Config = {
	preset: '@react-native/jest-preset',
	testMatch: [
		'**/__tests__/**/*.(spec|test).(js|ts|tsx)',
		'!**/node_modules/**',
	],
	collectCoverageFrom: [
		'app/**/*.js',
		'app/**/*.ts',
		'app/**/*.tsx',
		'modules/**/*.js',
		'modules/**/*.ts',
		'modules/**/*.tsx',
		'source/**/*.js',
		'source/**/*.ts',
		'source/**/*.tsx',
		'!**/node_modules/**',
	],
	setupFiles: ['./scripts/jest-setup.js'],
	transform: {
		'^.+\\.mjs$': 'babel-jest',
	},
	// pnpm nests every package under node_modules/.pnpm/<name>@<version>/node_modules/<name>,
	// so the first node_modules/ segment is followed by ".pnpm", not a package
	// name -- without letting that through, the negative lookahead trips on
	// ".pnpm" itself and every pnpm-installed package gets ignored, ESM or not.
	transformIgnorePatterns: [
		`node_modules/(?!\\.pnpm|${esmPackages.join('|')})`,
	],
	reporters: [['github-actions', {silent: false}], 'summary'],
}

export default config
