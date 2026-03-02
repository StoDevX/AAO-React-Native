module.exports = function (api) {
	api.cache(true)
	return {
		presets: ['babel-preset-expo'],
		plugins: [
			// the react-native-reanimated plugin must come last
			'react-native-reanimated/plugin',
		],
		env: {
			production: {
				plugins: ['transform-remove-console'],
			},
		},
	}
}
