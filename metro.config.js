/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const defaultSourceExts =
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('metro-config/src/defaults/defaults').sourceExts

module.exports = {
	resolver: {
		sourceExts:
			process.env.APP_MODE === 'mocked'
				? ['mock.ts', ...defaultSourceExts]
				: defaultSourceExts,
	},
	transformer: {
		getTransformOptions: () => ({
			transform: {
				experimentalImportSupport: false,
				inlineRequires: false,
			},
		}),
	},
}
