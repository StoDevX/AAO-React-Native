import type {ExpoConfig} from 'expo/config'

const config: ExpoConfig = {
	name: 'All About Olaf',
	slug: 'all-about-olaf',
	scheme: 'AllAboutOlaf',
	version: '1.0.0',
	orientation: 'default',
	ios: {
		bundleIdentifier: 'NFMTHAZVS9.com.drewvolz.stolaf',
		buildNumber: '1',
		supportsTablet: true,
		config: {
			usesNonExemptEncryption: false,
		},
		infoPlist: {
			UIStatusBarStyle: 'UIStatusBarStyleDarkContent',
			UIViewControllerBasedStatusBarAppearance: false,
			UIStatusBarHidden: false,
			UIBackgroundModes: ['audio'],
			UIRequiredDeviceCapabilities: ['armv7'],
			UISupportedInterfaceOrientations: [
				'UIInterfaceOrientationPortrait',
				'UIInterfaceOrientationLandscapeLeft',
				'UIInterfaceOrientationLandscapeRight',
			],
			'UISupportedInterfaceOrientations~ipad': [
				'UIInterfaceOrientationPortrait',
				'UIInterfaceOrientationPortraitUpsideDown',
				'UIInterfaceOrientationLandscapeLeft',
				'UIInterfaceOrientationLandscapeRight',
			],
			NSAppTransportSecurity: {
				NSAllowsArbitraryLoadsInWebContent: true,
				NSExceptionDomains: {
					localhost: {
						NSTemporaryExceptionAllowsInsecureHTTPLoads: true,
					},
				},
			},
		},
	},
	plugins: [],
}

export default config
