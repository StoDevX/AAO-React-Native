import AVFoundation
internal import Expo
import React
import ReactAppDependencyProvider
import UIKit

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    if ProcessInfo.processInfo.arguments.contains("--uitesting") {
      // Future: disable animations, skip onboarding, or set up
      // any other test-only state here.
    }

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

    // ignore vibrate/silent switch when playing audio
    try? AVAudioSession.sharedInstance().setCategory(.playback)

    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "AllAboutOlaf",
      in: window,
      launchOptions: launchOptions)

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options)
      || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(
      application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(
      application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
      // Prefer a pre-bundled jsbundle when it exists (e.g. CI UITest runs that inject
      // the bundle into the app package). Falls back to Metro for normal local development.
      if let bundled = Bundle.main.url(forResource: "main", withExtension: "jsbundle") {
        return bundled
      }
      return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
      return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
