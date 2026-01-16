const {getSentryExpoConfig} = require('@sentry/react-native/metro')

const defaultSourceExts =
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('metro-config/src/defaults/defaults').sourceExts

const config = getSentryExpoConfig(__dirname)

config.resolver.sourceExts =
	process.env.APP_MODE === 'mocked'
		? ['mock.ts', ...defaultSourceExts]
		: defaultSourceExts

module.exports = config
