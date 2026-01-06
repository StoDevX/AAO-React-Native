/**
 * Metro configuration for Expo
 * https://docs.expo.dev/guides/customizing-metro/
 *
 * @type {import('expo/metro-config').MetroConfig}
 */

const {getDefaultConfig} = require('expo/metro-config')

const defaultSourceExts =
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('metro-config/src/defaults/defaults').sourceExts

const config = getDefaultConfig(__dirname)

config.resolver.sourceExts =
	process.env.APP_MODE === 'mocked'
		? ['mock.ts', ...defaultSourceExts]
		: defaultSourceExts

module.exports = config
