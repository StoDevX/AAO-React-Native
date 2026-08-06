import type {ExpoConfig} from 'expo/config'

import {version} from './package.json'

/**
 * The declarative description of the iOS project.
 *
 * Nothing reads this yet — `ios/` is still tracked and authoritative. It
 * becomes the source of truth when `expo prebuild` takes over.
 */
const config: ExpoConfig = {
	name: 'All About Olaf',
	slug: 'all-about-olaf',
	scheme: 'AllAboutOlaf',
	version,
	platforms: ['ios'],
	icon: './images/icons/app-icon.png',
	userInterfaceStyle: 'automatic',

	// No `orientation` here. Its three presets are portrait
	// (portrait + upside-down), landscape (both landscapes) and default (all
	// four); we allow all four *except* upside-down, which none of them
	// expresses. `withOrientation` steps aside when
	// `ios.infoPlist.UISupportedInterfaceOrientations` is set, and warns if
	// `orientation` is also set — so setting both would only add noise.

	ios: {
		bundleIdentifier: 'NFMTHAZVS9.com.drewvolz.stolaf',
		// Xcode Cloud's build number becomes an input to generation rather than
		// something agvtool edits afterwards.
		buildNumber: process.env.CI_BUILD_NUMBER ?? '17',
		supportsTablet: true,

		// Only NSPrivacyAccessedAPITypes is declared, which is all the current
		// PrivacyInfo.xcprivacy holds. Expo's schema covers it, so no plugin.
		privacyManifests: {
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
					NSPrivacyAccessedAPIType:
						'NSPrivacyAccessedAPICategorySystemBootTime',
					NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
				},
				{
					NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
					NSPrivacyAccessedAPITypeReasons: ['E174.1', '85F4.1'],
				},
			],
		},

		infoPlist: {
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
			NSLocalNetworkUsageDescription:
				'Used in development mode to discover a local ccc-server instance on the same network.',

			// Radio playback continues when the screen locks, and ignores the
			// silent switch — see the AppDelegate plugin for the other half.
			UIBackgroundModes: ['audio'],

			// No UIAppFonts: each @react-native-vector-icons plugin adds its own
			// font to the list, and their podspecs ship the .ttf as a resource.

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

	plugins: [
		[
			'expo-build-properties',
			{
				ios: {
					// Expo SDK 57 needs at least 16.4; the project has run ahead of
					// that since SDK 56, and the Podfile must not drift from it.
					deploymentTarget: '18.6',
					ccacheEnabled: process.env.USE_CCACHE === '1',
				},
			},
		],
		'@react-native-vector-icons/entypo',
		'@react-native-vector-icons/ionicons',
		'@react-native-vector-icons/material-design-icons',
		'./plugins/with-app-delegate-customizations',
		'./plugins/with-alternate-icons',
		'./plugins/with-xcuitest-target',
		'./plugins/with-binary-stripping',
	],
}

export default config
