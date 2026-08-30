module.exports = {
	presets: [['babel-preset-expo', {worklets: false}], '@babel/preset-typescript'],
	plugins: [
		// the worklets plugin must come last
		'react-native-worklets/plugin',
	],
	env: {
		production: {
			plugins: ['transform-remove-console'],
		},
	},
}
