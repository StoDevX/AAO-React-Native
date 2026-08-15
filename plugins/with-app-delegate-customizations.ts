import {ConfigPlugin, withAppDelegate} from '@expo/config-plugins'

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
 * Reapply the three things our AppDelegate does that the Expo template does not.
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

	if (!result.includes('forBundleRoot: "index"')) {
		require_(result, METRO_ANCHOR)
		let metroLine = result.split('\n').find((line) => line.includes(METRO_ANCHOR)) as string
		result = result.replace(metroLine, BUNDLE_URL_BODY)
	}

	return result
}

/// iOS 27 traps at launch for any app that has not adopted the UIScene
/// lifecycle, so the app declares a scene manifest -- and once it does, UIKit
/// owns the scene and stops presenting the window AppDelegate builds. The app
/// launched to a black screen until something handed that window to the scene.
///
/// This keeps React Native's startup where it already is, in
/// `didFinishLaunchingWithOptions`, and only adopts the window that startup
/// produced. Moving the whole of it into the scene delegate would be the more
/// thorough adoption and a much larger change to generated code.
///
/// Appended to AppDelegate.swift rather than written as its own file: a new
/// source file would have to be threaded into the generated Xcode project,
/// and Swift does not care which file a class lives in.
const SCENE_DELEGATE = `
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }
    guard
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let existing = appDelegate.window
    else { return }

    existing.windowScene = windowScene
    self.window = existing
    existing.makeKeyAndVisible()
  }
}
`

export function appendSceneDelegate(contents: string): string {
	if (contents.includes('class SceneDelegate')) {
		return contents
	}
	return `${contents.trimEnd()}\n${SCENE_DELEGATE}`
}

const withAppDelegateCustomizations: ConfigPlugin = (config) =>
	withAppDelegate(config, (mod) => {
		if (mod.modResults.language !== 'swift') {
			throw new Error(
				`with-app-delegate-customizations: expected a Swift AppDelegate, got ${mod.modResults.language}.`,
			)
		}

		mod.modResults.contents = appendSceneDelegate(patchAppDelegate(mod.modResults.contents))
		return mod
	})

export default withAppDelegateCustomizations
