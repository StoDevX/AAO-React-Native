module.exports = {
	presets: ['babel-preset-expo'],
	env: {
		production: {
			plugins: ['transform-remove-console'],
		},
	},
}
