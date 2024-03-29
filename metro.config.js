/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */

const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config')

const defaultSourceExts =
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('metro-config/src/defaults/defaults').sourceExts

const config = {
	resolver: {
		sourceExts:
			process.env.APP_MODE === 'mocked'
				? ['mock.ts', ...defaultSourceExts]
				: defaultSourceExts,
	},
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)
