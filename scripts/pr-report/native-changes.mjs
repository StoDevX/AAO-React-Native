/**
 * Find the changes in a pull request that need a new native build.
 */

/**
 * Files that feed the generated Xcode project: the app config, which holds
 * Info.plist, entitlements and the privacy manifest, and the config plugins
 * that rewrite the project. A plugin's own test does not.
 */
export const CONFIG_FILE = /^(app\.config\.ts|plugins\/(?!.*\.test\.ts$).+)$/u

/** Swift, Objective-C and podspec sources of the app's own native modules. */
export const CODE_FILE = /^modules\/[^/]+\/ios\//u

/**
 * Packages that ship native code, and so add or change pods: Expo's and React
 * Native's own, and the community's `react-native-*`. A package named this
 * way may be JS only; the notice says "likely".
 */
const NATIVE_PACKAGE =
	/^(expo|expo-.+|@expo\/.+|react-native|react-native-.+|@react-native\/.+|@react-native-.+)$/u

/**
 * Sorts a pull request's changed files, and its package changes from the
 * dependency diff (empty without a baseline), into the three kinds that need
 * a native build. Returns null when none apply.
 */
export function findNativeChanges({files, packageChanges}) {
	let sorted = (pattern) => files.filter((file) => pattern.test(file)).sort()
	let changes = {
		config: sorted(CONFIG_FILE),
		code: sorted(CODE_FILE),
		packages: packageChanges.filter((change) => NATIVE_PACKAGE.test(change.name)),
	}
	let any = changes.config.length + changes.code.length + changes.packages.length > 0
	return any ? changes : null
}
