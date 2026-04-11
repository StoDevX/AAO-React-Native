const isTestEnv = process.env.NODE_ENV === 'test'

module.exports = {
	presets: [
		[
			'module:@react-native/babel-preset',
			isTestEnv ? {disableImportExportTransform: true} : {},
		],
		'@babel/preset-typescript',
	],
	plugins: [
		'@babel/plugin-transform-export-namespace-from',
		['@babel/plugin-transform-private-methods', {loose: true}],
		// the react-native-reanimated plugin must come last
		'react-native-reanimated/plugin',
	],
	overrides: isTestEnv
		? [
				{
					// Re-enable CJS module transform for node_modules so Babel
					// helpers injected by other plugins are emitted as require()
					// calls, keeping node_modules output valid CJS.
					test: /node_modules/,
					plugins: [
						[
							'@babel/plugin-transform-modules-commonjs',
							{
								strict: false,
								strictMode: false,
								allowTopLevelThis: true,
							},
						],
					],
				},
			]
		: [],
	env: {
		production: {
			plugins: ['transform-remove-console'],
		},
	},
}
