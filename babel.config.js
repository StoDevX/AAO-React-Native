module.exports = {
	presets: [
		['babel-preset-expo', {worklets: false}],
		'@babel/preset-typescript',
	],
	plugins: [
		'@babel/plugin-transform-export-namespace-from',
		['@babel/plugin-transform-private-methods', {loose: true}],
		// the worklets plugin must come last
		'react-native-worklets/plugin',
	],
	env: {
		production: {
			plugins: ['transform-remove-console'],
		},
	},
}
