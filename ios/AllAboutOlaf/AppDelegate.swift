import AVFoundation
import React
import React_RCTAppDelegate
import Security
import UIKit

@UIApplicationMain
class AppDelegate: RCTAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
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
      // Clear Keychain (expo-secure-store credentials)
      let keychainQuery: [String: Any] = [kSecClass as String: kSecClassGenericPassword]
      SecItemDelete(keychainQuery as CFDictionary)
    }

    self.moduleName = "AllAboutOlaf"

    // set up the requests cacher
    let urlCache = URLCache(
      memoryCapacity: 4 * 1024 * 1024,  // 4 MiB
      diskCapacity: 20 * 1024 * 1024    // 20 MiB
    )
    URLCache.shared = urlCache

    // ignore vibrate/silent switch when playing audio
    try? AVAudioSession.sharedInstance().setCategory(.playback)

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
