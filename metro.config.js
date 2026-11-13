/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */

// @expo/metro-config, not @react-native/metro-config: the `expo` CLI (used
// for `expo start`/`run:ios`/`export:embed`) expects its own serializer
// output shape and errors ("Serializer did not return expected format")
// against the bare React Native config.
const {getDefaultConfig} = require('@expo/metro-config')
const {getSentryExpoConfig} = require('@sentry/react-native/metro')
const {mergeConfig} = require('metro-config')
const {EMPTY_FIXTURE, stubsFixture} = require('./scripts/metro-fixtures.mjs')

// Sentry's wrapper adds a debug ID to the bundle and its source map, so Sentry
// matches the two by ID rather than by release name. It is handed the same
// getDefaultConfig as before so the base config does not change.
//
// @sentry/browser re-exports the web session replay and feedback widgets, which
// the app never turns on (it has no replayIntegration or feedbackIntegration);
// Sentry leaves both in the bundle unless told otherwise.
const defaultConfig = getSentryExpoConfig(__dirname, {
	getDefaultConfig,
	includeWebReplay: false,
	includeWebFeedback: false,
})

// The resolver Sentry's config installs; the stub below resolves through it,
// then swaps a fixture's result.
const upstreamResolve = defaultConfig.resolver.resolveRequest

/** The Android stand-in for @expo/ui/swift-ui; see resolveRequest below. */
const ANDROID_UI = `${__dirname}/source/android-ui/index.tsx`

/** The Android stand-in for expo-symbols' SymbolView; see resolveRequest below. */
const ANDROID_SYMBOL_VIEW = `${__dirname}/source/android-ui/symbol-view.tsx`

/** The Android stand-in for Expo Router's toolbar items; see resolveRequest below. */
const ANDROID_TOOLBAR = `${__dirname}/source/android-ui/toolbar.tsx`

/** Expo Router's Android toolbar button and menu modules, which ANDROID_TOOLBAR wraps. */
const EXPO_ROUTER_TOOLBAR_ITEMS =
	/expo-router\/build\/layouts\/stack-utils\/toolbar\/StackToolbar(Button|Menu)\/native\.android\.js$/

const config = {
	transformer: {
		// Turns Wiki Monkeys' .yaml fixtures into JSON modules, then hands every
		// file to Expo's transformer; see scripts/metro-yaml-transformer.mjs.
		babelTransformerPath: require.resolve('./scripts/metro-yaml-transformer.mjs'),
	},
	resolver: {
		// A release bundle carries an empty object for each UI-test fixture, which
		// only --uitesting reads; `mise run bundle:ios` keeps them, for the UI tests.
		resolveRequest: (context, moduleName, platform) => {
			// The screens are written against SwiftUI through @expo/ui/swift-ui,
			// whose native views exist only on iOS. On Android that import resolves
			// to source/android-ui, which implements the same components in Material
			// 3 on Jetpack Compose. The modifiers module is plain data and loads as
			// is. iOS resolves normally; Jest maps the import to its own mock.
			if (platform === 'android' && moduleName === '@expo/ui/swift-ui') {
				return {type: 'sourceFile', filePath: ANDROID_UI}
			}
			// SymbolView draws a Material Symbol on Android only for an `android`
			// name, and the screens name SF Symbols, so it drew nothing. On Android
			// it resolves to one that draws the SF Symbol's Material counterpart.
			if (platform === 'android' && moduleName === 'expo-symbols') {
				return {type: 'sourceFile', filePath: ANDROID_SYMBOL_VIEW}
			}
			let resolution = upstreamResolve(context, moduleName, platform)
			// Expo Router's Android toolbar draws an item only from an image
			// source, and the screens name SF Symbols, so every icon button and
			// menu in a top app bar went missing. Its button and menu modules
			// resolve to wrappers that hand them the Material Symbol instead,
			// except from the wrappers themselves, which import the originals.
			if (
				platform === 'android' &&
				resolution.type === 'sourceFile' &&
				EXPO_ROUTER_TOOLBAR_ITEMS.test(resolution.filePath) &&
				context.originModulePath !== ANDROID_TOOLBAR
			) {
				return {type: 'sourceFile', filePath: ANDROID_TOOLBAR}
			}
			let keep = process.env.KEEP_UITEST_FIXTURES === '1'
			if (
				resolution.type === 'sourceFile' &&
				stubsFixture(resolution.filePath, {dev: context.dev, keep})
			) {
				return {type: 'sourceFile', filePath: EMPTY_FIXTURE}
			}
			return resolution
		},
		// yaml: Wiki Monkeys' fixtures, which the transformer above turns into JSON.
		// Expo also lists yaml as an asset type, which Metro checks first.
		assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== 'yaml'),
		sourceExts:
			process.env.APP_MODE === 'mocked'
				? ['mock.ts', ...defaultConfig.resolver.sourceExts, 'yaml']
				: [...defaultConfig.resolver.sourceExts, 'yaml'],
		// Honor the package.json "exports" field so modern ESM packages with
		// subpath exports (e.g. `entities/decode` used by htmlparser2 v12)
		// resolve correctly. Metro ships this off-by-default in RN 0.76.
		unstable_enablePackageExports: true,
	},
}

module.exports = mergeConfig(defaultConfig, config)
