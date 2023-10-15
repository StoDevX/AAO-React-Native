/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

module.exports = {
	dependencies: {
		...(process.env.NO_FLIPPER || process.env.CI
			? {'react-native-flipper': {platforms: {ios: null}}}
			: {}),
	},
	project: {
		ios: {
			sourceDir: 'ios',
		},
	},
}
