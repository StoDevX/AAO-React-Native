/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

module.exports = {
	transformer: {
		getTransformOptions: () => ({
			transform: {
				experimentalImportSupport: false,
				inlineRequires: false,
			},
		}),
	},
	dependencies: {
		'react-native-custom-tabs': {
			platforms: {
				ios: null,
			},
		},
	},
}
