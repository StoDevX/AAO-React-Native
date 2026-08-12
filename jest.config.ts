import type {Config} from 'jest'

// Packages that ship as ESM-only and need Babel transformation for Jest
const esmPackages = [
	'(jest-)?react-native',
	'@react-native',
	'@frogpond',
	'glamorous-native',
	'@reduxjs/toolkit',
	'immer',
	'redux',
	'redux-thunk',
	'reselect',
	'expo',
	'@expo',
	'@maplibre/maplibre-react-native',
	'ky',
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
	// Agent worktrees under .claude/ are whole checkouts of this repo, so every
	// package in modules/ turns up once per worktree and jest-haste-map rejects
	// the duplicate names -- taking down every suite, not just the copies.
	// Prettier reads .gitignore and eslint runs against named directories, so
	// this is the one tool that has to be told.
	modulePathIgnorePatterns: ['<rootDir>/.claude/worktrees/'],
	setupFiles: ['./scripts/jest-setup.js'],
	// Merged with the preset's own mapping rather than replacing it. The
	// preset transforms image assets but leaves fonts alone, and the
	// @react-native-vector-icons packages import their .ttf directly.
	moduleNameMapper: {
		'\\.(ttf|otf)$': '<rootDir>/scripts/jest-font-mock.js',
	},
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
