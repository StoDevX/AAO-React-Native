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

/**
 * Which build this is. Set `APP_VARIANT=development` to get an app that
 * installs alongside the real one instead of replacing it on your device.
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
	production: {
		displayName: 'All About Olaf',
		bundleIdentifier: BUNDLE_ID,
		scheme: 'AllAboutOlaf',
		icon: './images/icons/app-icon.png',
	},
	development: {
		displayName: 'AAO Dev',
		bundleIdentifier: `${BUNDLE_ID}.dev`,
		scheme: 'AllAboutOlafDev',
		// The shipping icon with a diagonal DEV ribbon across the top-right
		// corner, which crosses sky rather than the building.
		icon: './images/icons/app-icon-development.png',
	},
}

const requested = process.env.APP_VARIANT ?? 'production'

if (!(requested in VARIANTS)) {
	// Loudly, rather than quietly shipping production's identity under a typo.
	throw new Error(`APP_VARIANT="${requested}" is not one of ${Object.keys(VARIANTS).join(', ')}.`)
}

const variant = VARIANTS[requested as keyof typeof VARIANTS]

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
	icon: variant.icon,
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
		// Xcode Cloud's build number becomes an input to generation rather than
		// something agvtool edits afterwards.
		buildNumber: process.env.CI_BUILD_NUMBER ?? '17',
		supportsTablet: true,

		// Expo's schema covers both keys the PrivacyInfo.xcprivacy needs, so no
		// plugin.
		privacyManifests: {
			// The map shows where you are on campus and nothing else: the
			// coordinate never leaves the device, is not tied to an account,
			// and is not used for tracking.
			NSPrivacyCollectedDataTypes: [
				{
					NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypePreciseLocation',
					NSPrivacyCollectedDataTypeLinked: false,
					NSPrivacyCollectedDataTypeTracking: false,
					NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
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

			CADisableMinimumFrameDurationOnPhone: true,
			ITSAppUsesNonExemptEncryption: false,

			// The server is plain HTTP in places, and mDNS discovery talks to
			// whatever ccc-server instance is on the local network.
			NSAppTransportSecurity: {
				NSAllowsArbitraryLoadsInWebContent: true,
				NSExceptionDomains: {
					localhost: {NSTemporaryExceptionAllowsInsecureHTTPLoads: true},
				},
			},
			NSBonjourServices: ['_ccc-server._tcp.'],
			// Note: remember to change this text in add-to-device-calendar's
			// lib.ts Settings-redirect alert, too.
			NSCalendarsUsageDescription:
				'We use your calendar to add events to your calendar so that you remember what you wanted to attend.',
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

	extra: {fullVersion},

	plugins: [
		[
			'expo-build-properties',
			{
				ios: {
					// Expo SDK 57 needs at least 16.4; the project has run ahead of
					// that since SDK 56, and the Podfile must not drift from it.
					deploymentTarget: '18.6',

					// Point CC/CXX at React Native's ccache wrappers, which only CI
					// asks for. A local build gets the plain compiler unless the
					// environment opts in.
					ccacheEnabled: process.env.USE_CCACHE === '1',
				},
			},
		],
		'expo-router',
		// Adds the MapLibre SDK to the generated project. On iOS that is a
		// Swift Package pulling a prebuilt MapLibre.xcframework from
		// maplibre-gl-native-distribution -- no pod source build, and no
		// access token anywhere in the pipeline.
		'@maplibre/maplibre-react-native',
		// react-native-enriched-markdown 1.0.2 dropped its Expo config plugin;
		// its options now live in the `enriched-markdown` block of package.json.
		'./plugins/with-app-delegate-customizations',
		'./plugins/with-alternate-icons',
		'./plugins/with-xcuitest-target',
		'./plugins/with-binary-stripping',
		'./plugins/with-inhibit-pod-warnings',
	],
}

export default config
