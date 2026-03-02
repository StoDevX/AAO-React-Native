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
		'node_modules/(?!(.pnpm/.+/node_modules/)?((jest-)?react-native|@react-native|@react-native-clipboard|@reduxjs|@frogpond|@expo|@sentry|@tanstack|expo|glamorous-native|react-navigation|react-native-button|react-native-inappbrowser-reborn|immer|invariant)(/|$))',
	],
	reporters: ['default', 'summary'],
}

export default config
