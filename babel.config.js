module.exports = {
	presets: ['babel-preset-expo'],
	plugins: ['@babel/plugin-transform-export-namespace-from'],
	env: {
		production: {
			plugins: ['transform-remove-console'],
		},
	},
}
