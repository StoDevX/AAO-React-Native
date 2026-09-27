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

// Sentry's wrapper adds a debug ID to the bundle and its source map, so Sentry
// matches the two by ID rather than by release name. It is handed the same
// getDefaultConfig as before so the base config does not change.
const defaultConfig = getSentryExpoConfig(__dirname, {getDefaultConfig})

const config = {
	resolver: {
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
