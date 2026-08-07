import {ConfigPlugin, withAppDelegate} from '@expo/config-plugins'

// The JS side calls AppRegistry.registerComponent with this name; the template
// hardcodes "main".
const MODULE_NAME = 'AllAboutOlaf'

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
		result = result.replace(
			'internal import Expo',
			'import AVFoundation\ninternal import Expo',
		)
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

	if (!result.includes(`withModuleName: "${MODULE_NAME}"`)) {
		require_(result, 'withModuleName: "main"')
		result = result.replace(
			'withModuleName: "main"',
			`withModuleName: "${MODULE_NAME}"`,
		)
	}

	if (!result.includes('forBundleRoot: "index"')) {
		require_(result, METRO_ANCHOR)
		let metroLine = result
			.split('\n')
			.find((line) => line.includes(METRO_ANCHOR)) as string
		result = result.replace(metroLine, BUNDLE_URL_BODY)
	}

	return result
}

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
