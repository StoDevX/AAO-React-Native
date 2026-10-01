/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */

// @expo/metro-config, not @react-native/metro-config: the `expo` CLI (used
// for `expo start`/`run:ios`/`export:embed`) expects its own serializer
// output shape and errors ("Serializer did not return expected format")
// against the bare React Native config.
const {getDefaultConfig} = require('@expo/metro-config')
const {getSentryExpoConfig} = require('@sentry/react-native/metro')
const {mergeConfig} = require('metro-config')
const {EMPTY_FIXTURE, stubsFixture} = require('./scripts/metro-fixtures.mjs')

// Sentry's wrapper adds a debug ID to the bundle and its source map, so Sentry
// matches the two by ID rather than by release name. It is handed the same
// getDefaultConfig as before so the base config does not change.
const defaultConfig = getSentryExpoConfig(__dirname, {getDefaultConfig})

// Expo's own resolver, which the fixture stub below runs first and then defers to.
const upstreamResolve = defaultConfig.resolver.resolveRequest

const config = {
	resolver: {
		// A release bundle carries an empty object for each UI-test fixture, which
		// only --uitesting reads; `mise run bundle:ios` keeps them, for the UI tests.
		resolveRequest: (context, moduleName, platform) => {
			let resolution = upstreamResolve(context, moduleName, platform)
			let keep = process.env.KEEP_UITEST_FIXTURES === '1'
			if (
				resolution.type === 'sourceFile' &&
				stubsFixture(resolution.filePath, {dev: context.dev, keep})
			) {
				return {type: 'sourceFile', filePath: EMPTY_FIXTURE}
			}
			return resolution
		},
		sourceExts:
			process.env.APP_MODE === 'mocked'
				? ['mock.ts', ...defaultConfig.resolver.sourceExts]
				: defaultConfig.resolver.sourceExts,
		// Honor the package.json "exports" field so modern ESM packages with
		// subpath exports (e.g. `entities/decode` used by htmlparser2 v12)
		// resolve correctly. Metro ships this off-by-default in RN 0.76.
		unstable_enablePackageExports: true,
	},
}

module.exports = mergeConfig(defaultConfig, config)
