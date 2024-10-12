module.exports = {
	presets: [
		'babel-preset-expo',
		'@babel/preset-typescript',
	],
	plugins: [
		'@babel/plugin-transform-export-namespace-from',
		// the react-native-reanimated plugin must come last
		'react-native-reanimated/plugin',
	],
	env: {
		production: {
			plugins: ['transform-remove-console'],
		},
	},
}
