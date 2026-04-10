module.exports = {
	presets: ['module:@react-native/babel-preset', '@babel/preset-typescript'],
	plugins: [
		'@babel/plugin-transform-export-namespace-from',
		['@babel/plugin-transform-private-methods', {loose: true}],
		// the react-native-reanimated plugin must come last
		'react-native-reanimated/plugin',
	],
	env: {
		production: {
			plugins: ['transform-remove-console'],
		},
	},
}
