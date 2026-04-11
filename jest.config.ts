import type {Config} from 'jest'

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
	transformIgnorePatterns: [
		'node_modules/(?!(jest-)?react-native|@react-native|@frogpond|glamorous-native|react-navigation|@reduxjs/toolkit|immer|redux|redux-thunk|reselect|css-select|boolbase|css-what|nth-check|domhandler|domutils|dom-serializer|domelementtype|entities)',
	],
	reporters: [['github-actions', {silent: false}], 'summary'],
}

export default config
