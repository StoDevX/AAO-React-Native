import {execFileSync} from 'node:child_process'

import type {ExpoConfig} from 'expo/config'

import {version as fullVersion} from './package.json'

/**
 * CFBundleShortVersionString takes this verbatim, and Apple accepts only
 * dot-separated numbers there, so a prerelease tag cannot go through. The
 * untouched string reaches the JS side as `extra.fullVersion`, where
 * setVersionInfo parses it for the flags isDebugBuild reads.
 */
const shippableVersion = fullVersion.split('-')[0]

const BUNDLE_ID = 'NFMTHAZVS9.com.drewvolz.stolaf'

/** The CARLS app's identifier, so a CARLS build updates the App Store's CARLS. */
const CARLS_BUNDLE_ID = 'com.rives.carls'

/** The windmill, an Icon Composer document. */
const AAO_ICON = './assets/windmill.icon'

/** The CARLS penguin, the CARLS app's own 1024px artwork. */
const CARLS_ICON = './assets/carls-penguin.xcassets/carls-penguin.appiconset/light.png'

/**
 * Which app this build is, which `APP_VARIANT` must name: `aao`, `carls`, or
 * their `-dev` builds, which install alongside the App Store's instead of
 * replacing it on your device. There is no default, so a forgotten variant
 * fails here rather than building and launching the other app.
 *
 * `carls` and `carls-dev` build the same code as CARLS: Carleton's
 * app, with the campus fixed to Carleton (`extra.app`, read by
 * source/lib/app-identity.ts), the penguin as its icon and no St. Olaf icons
 * to switch to.
 *
 * The identity has to differ in three places, not one: iOS keys installs on the
 * bundle identifier, the home screen shows the name, and two apps claiming the
 * same URL scheme is undefined behaviour — whichever iOS feels like wins.
 *
 * Defined inline rather than imported from a helper: Expo's config loader
 * compiles this file on its own, so `import {x} from './somewhere'` throws
 * `Cannot find module` at prebuild time. See __tests__/app.config.test.ts.
 */
const VARIANTS = {
	aao: {
		app: 'aao',
		displayName: 'All About Olaf',
		bundleIdentifier: BUNDLE_ID,
		scheme: 'AllAboutOlaf',
		icon: AAO_ICON,
	},
	'aao-dev': {
		app: 'aao',
		displayName: 'AAO Dev',
		bundleIdentifier: `${BUNDLE_ID}.dev`,
		scheme: 'AllAboutOlafDev',
		icon: AAO_ICON,
	},
	carls: {
		app: 'carls',
		displayName: 'CARLS',
		bundleIdentifier: CARLS_BUNDLE_ID,
		// The CARLS app's own scheme, so links made for it still open it.
		scheme: 'carls',
		icon: CARLS_ICON,
	},
	'carls-dev': {
		app: 'carls',
		displayName: 'CARLS Dev',
		bundleIdentifier: `${CARLS_BUNDLE_ID}.dev`,
		scheme: 'carlsDev',
		icon: CARLS_ICON,
	},
} as const

const requested = process.env.APP_VARIANT

if (!requested) {
	throw new Error(`APP_VARIANT is not set. Set it to one of ${Object.keys(VARIANTS).join(', ')}.`)
}

if (!(requested in VARIANTS)) {
	// Loudly, rather than quietly building another app's identity under a typo.
	throw new Error(`APP_VARIANT="${requested}" is not one of ${Object.keys(VARIANTS).join(', ')}.`)
}

const variant = VARIANTS[requested as keyof typeof VARIANTS]

/**
 * The short git SHA of the checkout, which says which commit a build came
 * from. Undefined outside a git checkout.
 */
function commitSha(): string | undefined {
	try {
		return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim()
	} catch {
		return undefined
	}
}

const commit = commitSha()

/**
 * The build number: Xcode Cloud's, when it sets one. A local build has no such
 * counter, so it takes the commit's SHA, which says which commit a device is
 * running. A SHA is not a number, so this suits a build to your own device,
 * never an upload to App Store Connect (CI always sets one). Falls back to a
 * fixed number outside a git checkout.
 */
const buildNumber = process.env.CI_BUILD_NUMBER ?? commit ?? '17'

/**
 * The declarative description of the iOS project.
 */
const config: ExpoConfig = {
	// Constant across variants: this also names the generated Xcode project,
	// its target, its scheme and its directory. The variant's own name goes to
	// CFBundleDisplayName below, which is what the home screen shows.
	name: 'All About Olaf',
	slug: 'all-about-olaf',
	scheme: variant.scheme,
	version: shippableVersion,

	// The contract between a build's native code and the JS bundle it will
	// load: a build only accepts bundles with a matching runtimeVersion.
	//
	// `fingerprint` hashes the native inputs, so it changes exactly when the
	// native project does -- which is the right granularity here, where ios/ is
	// generated from this file and plugins/. `appVersion` would hold at 2.8.0
	// across native changes, and `nativeVersion` would change on every CI build
	// number even when nothing native moved.
	//
	// Inert until expo-updates or expo-dev-client is installed: the policy is
	// resolved by their tooling, and it is their config plugin that writes the
	// value into the Info.plist.
	runtimeVersion: {policy: 'fingerprint'},
	platforms: ['ios'],
	userInterfaceStyle: 'automatic',

	experiments: {
		typedRoutes: true,
	},

	// No `orientation` here. Its three presets are portrait
	// (portrait + upside-down), landscape (both landscapes) and default (all
	// four); we allow all four *except* upside-down, which none of them
	// expresses. `withOrientation` steps aside when
	// `ios.infoPlist.UISupportedInterfaceOrientations` is set, and warns if
	// `orientation` is also set — so setting both would only add noise.

	ios: {
		bundleIdentifier: variant.bundleIdentifier,
		// Written into every target as DEVELOPMENT_TEAM. Without it, `expo run:ios
		// --device` reads the Mac's signing certificates to pick a team itself.
		appleTeamId: 'TMK6S7TPX2',
		// plugins/with-alternate-icons adds the others, All About Olaf's alone.
		icon: variant.icon,
		// Xcode Cloud's build number becomes an input to generation rather than
		// something agvtool edits afterwards.
		buildNumber,
		supportsTablet: true,

		// Expo's schema covers both keys the PrivacyInfo.xcprivacy needs, so no
		// plugin.
		privacyManifests: {
			// Location: the map shows where you are on campus and nothing else.
			// The coordinate never leaves the device, is not tied to an account,
			// and is not used for tracking.
			//
			// The rest is what Sentry sends when sharing is on (the Settings
			// switch): crash reports, performance traces, counts of which screens
			// and features are used, and a random ID made per install. None of it
			// is tied to a person, and none of it is used for tracking.
			NSPrivacyCollectedDataTypes: [
				{
					NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypePreciseLocation',
					NSPrivacyCollectedDataTypeLinked: false,
					NSPrivacyCollectedDataTypeTracking: false,
					NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
				},
				{
					NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCrashData',
					NSPrivacyCollectedDataTypeLinked: false,
					NSPrivacyCollectedDataTypeTracking: false,
					NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
				},
				{
					NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypePerformanceData',
					NSPrivacyCollectedDataTypeLinked: false,
					NSPrivacyCollectedDataTypeTracking: false,
					NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
				},
				{
					NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeProductInteraction',
					NSPrivacyCollectedDataTypeLinked: false,
					NSPrivacyCollectedDataTypeTracking: false,
					NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAnalytics'],
				},
				{
					NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeDeviceID',
					NSPrivacyCollectedDataTypeLinked: false,
					NSPrivacyCollectedDataTypeTracking: false,
					NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAnalytics'],
				},
			],
			NSPrivacyAccessedAPITypes: [
				{
					NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
					NSPrivacyAccessedAPITypeReasons: ['C617.1', '0A2A.1', '3B52.1'],
				},
				{
					NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
					NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
				},
				{
					NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
					NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
				},
				{
					NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
					NSPrivacyAccessedAPITypeReasons: ['E174.1', '85F4.1'],
				},
			],
		},

		infoPlist: {
			CFBundleDisplayName: variant.displayName,

			// iOS 27 traps at launch in
			// `__UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`
			// for any app that has not adopted the UIScene lifecycle -- what was
			// a runtime warning through iOS 26 is now EXC_BREAKPOINT before
			// React Native starts, so the app dies with no JS error and no
			// usable console output.
			//
			// Declaring the manifest is the adoption UIKit checks for. There is
			// deliberately no `UISceneConfigurations`: without one UIKit creates
			// a default scene and the window AppDelegate already builds keeps
			// working, so this stays a plist change rather than a rewrite of how
			// the root view is hosted.
			UIApplicationSceneManifest: {
				UIApplicationSupportsMultipleScenes: false,
				UISceneConfigurations: {
					UIWindowSceneSessionRoleApplication: [
						{
							UISceneConfigurationName: 'Default Configuration',
							UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
						},
					],
				},
			},

			// Without these, iOS answers canOpenURL "no" for calls and email on
			// every device, so the app could not tell whether it can call or email.
			LSApplicationQueriesSchemes: ['tel', 'mailto'],

			CADisableMinimumFrameDurationOnPhone: true,
			ITSAppUsesNonExemptEncryption: false,

			// The server is plain HTTP in places, and mDNS discovery talks to
			// whatever ccc-server instance is on the local network.
			NSAppTransportSecurity: {
				NSAllowsArbitraryLoadsInWebContent: true,
				NSExceptionDomains: {
					localhost: {NSTemporaryExceptionAllowsInsecureHTTPLoads: true},
					// KRLX's stream server offers no forward-secret cipher. A device
					// loads the stream in mediaplaybackd, outside the app's ATS, but
					// the simulator loads it in the app, where ATS refuses it.
					's3.voscast.com': {NSExceptionRequiresForwardSecrecy: false},
				},
			},
			NSBonjourServices: ['_ccc-server._tcp.'],
			NSLocalNetworkUsageDescription:
				'Used in development mode to discover a local ccc-server instance on the same network.',
			NSLocationWhenInUseUsageDescription: 'Shows your location on the campus map.',

			// Radio playback continues when the screen locks, and ignores the
			// silent switch — see the AppDelegate plugin for the other half.
			UIBackgroundModes: ['audio'],

			UIStatusBarHidden: false,
			UIStatusBarStyle: 'UIStatusBarStyleDarkContent',
			UIViewControllerBasedStatusBarAppearance: false,

			// The phone allows everything but upside-down. No `orientation`
			// preset expresses that, so the array is spelled out.
			UISupportedInterfaceOrientations: [
				'UIInterfaceOrientationPortrait',
				'UIInterfaceOrientationLandscapeLeft',
				'UIInterfaceOrientationLandscapeRight',
			],

			// No `UISupportedInterfaceOrientations~ipad`: with `supportsTablet`
			// and no `requireFullScreen`, `withRequiresFullScreen` overwrites it
			// with all four orientations, which iPad multitasking demands and
			// which is what the project already declares. Setting it here would
			// look authoritative while being ignored.

			UIRequiredDeviceCapabilities: ['armv7'],
		},
	},

	extra: {fullVersion, commit, app: variant.app},

	plugins: [
		[
			'expo-build-properties',
			{
				ios: {
					deploymentTarget: '27.0',

					// Point CC/CXX at React Native's ccache wrappers, which only CI
					// asks for. A local build gets the plain compiler unless the
					// environment opts in.
					ccacheEnabled: process.env.USE_CCACHE === '1',
				},
			},
		],
		'expo-router',
		// The Report a Problem screen picks through PHPickerViewController, which
		// asks for no permission; these strings exist because the module links
		// the photo-library and camera APIs, and App Store Connect rejects a
		// binary that links them without a purpose string.
		[
			'expo-image-picker',
			{
				photosPermission: 'Photos you choose are attached to a problem report you send.',
				cameraPermission: 'Photos you take are attached to a problem report you send.',
				microphonePermission: false,
			},
		],
		// The radio plays through this module, never records. Background playback
		// is already declared above, so the plugin adds only what it cannot skip;
		// `false` drops the microphone usage string it would otherwise write.
		['expo-audio', {microphonePermission: false}],
		// Adding an event goes through the system editor, which needs no
		// calendar access, but the module links EventKit, and App Store Connect
		// rejects an upload that does so without a calendar usage string
		// (ITMS-90683). The plugin applies itself even when unlisted and adds
		// its usage strings; `false` removes one, so reminders stay out.
		[
			'expo-calendar',
			{
				calendarPermission:
					'We use your calendar to add events to your calendar so that you remember what you wanted to attend.',
				remindersPermission: false,
			},
		],
		// Adds the MapLibre SDK to the generated project. On iOS that is a
		// Swift Package pulling a prebuilt MapLibre.xcframework from
		// maplibre-gl-native-distribution -- no pod source build, and no
		// access token anywhere in the pipeline.
		'@maplibre/maplibre-react-native',
		// Wraps the bundle phase so a Release build uploads its source maps, and
		// adds a phase that uploads the dSYMs. Both skip Debug builds, which is
		// all GitHub Actions and `mise run device` make. The auth token comes from
		// the build environment; passing it here would write it into
		// ios/sentry.properties.
		//
		// with-sentry-debug-files-environment edits a phase this plugin writes,
		// and Expo runs a later plugin's project mod first, so it goes above.
		'./plugins/with-sentry-debug-files-environment',
		'./plugins/with-sentry-cli-executable',
		'./plugins/with-tree-shaking',
		// Xcode's own build phases read app.config.ts too, so ios/ remembers its variant.
		['./plugins/with-app-variant', {variant: requested}],
		[
			'@sentry/react-native/expo',
			{
				organization: 'frog-pond-labs',
				project: variant.app === 'carls' ? 'carls' : 'all-about-olaf',
			},
		],
		// react-native-enriched-markdown 1.0.2 dropped its Expo config plugin;
		// its options now live in the `enriched-markdown` block of package.json.
		'./plugins/with-app-delegate-customizations',
		// DebugSwift, in Debug builds only; Release never links it.
		'./plugins/with-debug-swift',
		// CARLS offers no icon but its penguin, which is its primary.
		['./plugins/with-alternate-icons', {alternates: variant.app === 'aao'}],
		'./plugins/with-custom-symbols',
		'./plugins/with-xcuitest-target',
		'./plugins/with-binary-stripping',
		'./plugins/with-inhibit-pod-warnings',
	],
}

export default config
