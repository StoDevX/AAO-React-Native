import {withAppDelegate} from '@expo/config-plugins'
import type {ConfigPlugin} from '@expo/config-plugins'

const BEGIN = '    // BEGIN aao customizations'
const END = '    // END aao customizations'

// Indentation-tolerant: only the anchor adapts. The injected Swift keeps its
// own formatting rather than trying to reflow to a moved template.
const LAUNCH_ANCHOR = /^[ \t]*let delegate = ReactNativeDelegate\(\)/mu

const STARTUP_BLOCK = `${BEGIN}
    if ProcessInfo.processInfo.arguments.contains("--reset-state") {
      let fileManager = FileManager.default
      if let libraryPath = fileManager.urls(for: .libraryDirectory, in: .userDomainMask).first {
        // Clear AsyncStorage 3.x (SharedStorage) and legacy RCTAsyncLocalStorage_V1
        let appSupportPath = libraryPath.appendingPathComponent("Application Support")
        if let bundleId = Bundle.main.bundleIdentifier {
          try? fileManager.removeItem(at: appSupportPath.appendingPathComponent(bundleId))
        }
        try? fileManager.removeItem(at: appSupportPath.appendingPathComponent("RCTAsyncLocalStorage_V1"))
      }
      if let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first {
        // Clear expo-sqlite's databases, which hold the calendar's saved events
        try? fileManager.removeItem(at: documentsPath.appendingPathComponent("SQLite"))
      }
      if let bundleId = Bundle.main.bundleIdentifier {
        UserDefaults.standard.removePersistentDomain(forName: bundleId)
      }
    }

    // set up the requests cacher
    let urlCache = URLCache(
      memoryCapacity: 4 * 1024 * 1024,  // 4 MiB
      diskCapacity: 20 * 1024 * 1024    // 20 MiB
    )
    URLCache.shared = urlCache

    // ignore the vibrate/silent switch when playing audio
    try? AVAudioSession.sharedInstance().setCategory(.playback)
${END}
`

const METRO_ANCHOR = 'jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")'

const BUNDLE_URL_BODY = `    // Prefer a pre-bundled jsbundle when one exists: CI injects it into the app
    // package for UITest runs. Falls back to Metro for local development.
    if let bundled = Bundle.main.url(forResource: "main", withExtension: "jsbundle") {
      return bundled
    }
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")`

function require_(contents: string, anchor: string): void {
	if (!contents.includes(anchor)) {
		throw new Error(
			`with-app-delegate-customizations: could not find \`${anchor}\` in AppDelegate.swift. The Expo template moved it; update this plugin rather than dropping the customization.`,
		)
	}
}

/**
 * Reapply the four things our AppDelegate does that the Expo template does not.
 * Idempotent: prebuild runs this on an already-patched file whenever the native
 * project is regenerated in place.
 */
export function patchAppDelegate(contents: string): string {
	let result = contents

	if (!result.includes('import AVFoundation')) {
		require_(result, 'internal import Expo')
		result = result.replace('internal import Expo', 'import AVFoundation\ninternal import Expo')
	}

	if (!result.includes(BEGIN)) {
		require_(result, 'didFinishLaunchingWithOptions')
		let match = LAUNCH_ANCHOR.exec(result)
		if (!match) {
			throw new Error(
				'with-app-delegate-customizations: could not find `let delegate = ReactNativeDelegate()` in AppDelegate.swift. The Expo template moved it; update this plugin rather than dropping the customization.',
			)
		}
		result = result.replace(match[0], `${STARTUP_BLOCK}\n${match[0]}`)
	}

	if (!result.includes('performActionFor shortcutItem')) {
		let match = LAUNCH_END_ANCHOR.exec(result)
		if (!match) {
			throw new Error(
				'with-app-delegate-customizations: could not find the end of `didFinishLaunchingWithOptions` in AppDelegate.swift. The Expo template moved it; update this plugin rather than dropping the customization.',
			)
		}
		result = result.replace(match[0], `${match[0]}\n${QUICK_ACTIONS}`)
	}

	if (!result.includes('forBundleRoot: "index"')) {
		require_(result, METRO_ANCHOR)
		let metroLine = result.split('\n').find((line) => line.includes(METRO_ANCHOR)) as string
		result = result.replace(metroLine, BUNDLE_URL_BODY)
	}

	return result
}

/// Expo's scene delegate hands a Home Screen quick action, from a cold launch
/// or a running app, to this method. The QuickActions module writes the route
/// an action opens as `href`; opening it as a link into this app's own scheme
/// sends it to Expo Router the way any deep link goes. The app delegate's
/// subscribers include expo-linking, which keeps the URL as the initial one
/// for a cold launch, and React Native's Linking event is what a running app
/// hears. The scheme is read from the bundle, since each app variant has its
/// own.
const QUICK_ACTIONS = `
  public override func application(
    _ application: UIApplication,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    guard
      let href = shortcutItem.userInfo?["href"] as? String,
      let urlTypes = Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes") as? [[String: Any]],
      let scheme = urlTypes.lazy.compactMap({ ($0["CFBundleURLSchemes"] as? [String])?.first }).first,
      let url = URL(string: "\\(scheme)://\\(href.drop(while: { $0 == "/" }))")
    else {
      super.application(application, performActionFor: shortcutItem, completionHandler: completionHandler)
      return
    }
    _ = self.application(application, open: url, options: [:])
    RCTLinkingManager.application(application, open: url, options: [:])
    completionHandler(true)
  }`

// The end of `didFinishLaunchingWithOptions`, after which the override goes.
const LAUNCH_END_ANCHOR =
	/^[ \t]*return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)\n[ \t]*\}/mu

const withAppDelegateCustomizations: ConfigPlugin = (config) =>
	withAppDelegate(config, (mod) => {
		if (mod.modResults.language !== 'swift') {
			throw new Error(
				`with-app-delegate-customizations: expected a Swift AppDelegate, got ${mod.modResults.language}.`,
			)
		}

		mod.modResults.contents = patchAppDelegate(mod.modResults.contents)
		return mod
	})

export default withAppDelegateCustomizations
