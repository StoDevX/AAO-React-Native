import AVFoundation
import React
import React_RCTAppDelegate
import UIKit

@UIApplicationMain
class AppDelegate: RCTAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    #if DEBUG
    if ProcessInfo.processInfo.arguments.contains("--reset-state") {
      if let libraryPath = FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask).first {
        let asyncStoragePath = libraryPath.appendingPathComponent("Application Support/RCTAsyncLocalStorage_V1")
        try? FileManager.default.removeItem(at: asyncStoragePath)
      }
      if let bundleId = Bundle.main.bundleIdentifier {
        UserDefaults.standard.removePersistentDomain(forName: bundleId)
      }
    }
    #endif

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
