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
		'node_modules/(?!(.pnpm/[^/]+/node_modules/)?((jest-)?react-native|@react-native|@frogpond|glamorous-native|react-navigation|expo|@expo|expo-router|expo-linking|expo-constants|expo-status-bar|expo-modules-core|expo-secure-store|expo-application|expo-device|expo-web-browser|expo-asset|expo-font|expo-system-ui|expo-updates|expo-calendar))',
	],
	reporters: [['github-actions', {silent: false}], 'summary'],
}

export default config
