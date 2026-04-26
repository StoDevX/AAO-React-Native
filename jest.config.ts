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
	'react-redux',
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
	preset: 'react-native',
	testMatch: [
		'**/__tests__/**/*.(spec|test).(js|ts|tsx)',
		'!**/node_modules/**',
	],
	collectCoverageFrom: [
		'modules/**/*.js',
		'modules/**/*.ts',
		'modules/**/*.tsx',
		'source/**/*.js',
		'source/**/*.ts',
		'source/**/*.tsx',
		'!**/node_modules/**',
	],
	setupFiles: ['./scripts/jest-setup.js'],
	transformIgnorePatterns: [`node_modules/(?!${esmPackages.join('|')})`],
	reporters: [['github-actions', {silent: false}], 'summary'],
}

export default config
