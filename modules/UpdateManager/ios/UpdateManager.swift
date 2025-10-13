// UpdateManager.swift
import Foundation

@objc(UpdateManager)
class UpdateManager: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  @objc(getAvailableUpdates:rejecter:)
  func getAvailableUpdates(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let nativeVersion = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as! String
    let channel = UserDefaults.standard.string(forKey: "updateChannel") ?? "release"
    let platform = "ios"

    let currentJSVersion = UserDefaults.standard.string(forKey: "currentJSVersion") ?? "0.0.0"

    let url = URL(string: "https://ghcr.io/v2/all-about-olaf/all-about-olaf/tags/list")!

    let task = URLSession.shared.dataTask(with: url) { data, response, error in
        guard let data = data, error == nil else {
            reject("E_NETWORK_ERROR", "Failed to fetch tags", error)
            return
        }

        do {
            if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
               let tags = json["tags"] as? [String] {

                let filteredTags = tags.filter { tag in
                    let components = tag.split(separator: "-")
                    if components.count != 3 { return false }
                    let tagVersion = String(components[0])
                    let tagNativeVersion = String(components[1])
                    let tagPlatform = String(components[2])

                    let channelMatches: Bool
                    if channel == "release" {
                        channelMatches = tagVersion.starts(with: "v")
                    } else {
                        channelMatches = tagVersion.starts(with: channel)
                    }

                    return tagPlatform == platform &&
                           tagNativeVersion == nativeVersion &&
                           channelMatches &&
                           tagVersion.compare(currentJSVersion, options: .numeric) == .orderedDescending
                }
                resolve(filteredTags)
            } else {
                reject("E_INVALID_RESPONSE", "Invalid response from GHCR", nil)
            }
        } catch {
            reject("E_JSON_PARSE_ERROR", "Failed to parse JSON", error)
        }
    }
    task.resume()
  }

  @objc(downloadUpdate:resolver:rejecter:)
  func downloadUpdate(tag: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let channel = UserDefaults.standard.string(forKey: "updateChannel") ?? "release"
    let updatesDir = getUpdatesDirectory().appendingPathComponent(channel)
    let updateDir = updatesDir.appendingPathComponent(tag)

    // 1. Fetch Manifest
    let manifestUrl = URL(string: "https://ghcr.io/v2/all-about-olaf/all-about-olaf/manifests/\(tag)")!
    var manifestRequest = URLRequest(url: manifestUrl)
    manifestRequest.setValue("application/vnd.oci.image.manifest.v1+json", forHTTPHeaderField: "Accept")

    let manifestTask = URLSession.shared.dataTask(with: manifestRequest) { data, response, error in
        guard let data = data, error == nil else {
            reject("E_NETWORK_ERROR", "Failed to fetch manifest", error)
            return
        }

        do {
            if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
               let layers = json["layers"] as? [[String: Any]],
               let layer = layers.first,
               let digest = layer["digest"] as? String {

                // 2. Download Blob
                self.downloadBlob(digest: digest, to: updateDir) { error in
                    if let error = error {
                        reject("E_DOWNLOAD_FAILED", "Failed to download update", error)
                        return
                    }

                    // 3. Clean up old updates
                    self.cleanupOldUpdates(in: updatesDir)

                    // 4. Save path for activation
                    let bundlePath = updateDir.appendingPathComponent("bundles/main.jsbundle").path
                    UserDefaults.standard.set(bundlePath, forKey: "jsBundlePath_pending")

                    resolve(bundlePath)
                }
            } else {
                reject("E_INVALID_MANIFEST", "Invalid manifest file", nil)
            }
        } catch {
            reject("E_JSON_PARSE_ERROR", "Failed to parse manifest JSON", error)
        }
    }
    manifestTask.resume()
  }

  private func downloadBlob(digest: String, to destinationDir: URL, completion: @escaping (Error?) -> Void) {
      let blobUrl = URL(string: "https://ghcr.io/v2/all-about-olaf/all-about-olaf/blobs/\(digest)")!

      let task = URLSession.shared.downloadTask(with: blobUrl) { localUrl, response, error in
          guard let localUrl = localUrl, error == nil else {
              completion(error)
              return
          }

          do {
              try FileManager.default.createDirectory(at: destinationDir, withIntermediateDirectories: true, attributes: nil)
              let destinationFile = destinationDir.appendingPathComponent("update.tar.gz")
              try FileManager.default.moveItem(at: localUrl, to: destinationFile)

              // Extract the archive
              let process = Process()
              process.executableURL = URL(fileURLWithPath: "/usr/bin/tar")
              process.arguments = ["-xzf", destinationFile.path, "-C", destinationDir.path]

              try process.run()
              process.waitUntilExit()

              // Clean up the archive
              try FileManager.default.removeItem(at: destinationFile)

              completion(nil)
          } catch {
              completion(error)
          }
      }
      task.resume()
  }

  private func getUpdatesDirectory() -> URL {
      let fileManager = FileManager.default
      let appSupportURL = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
      let updatesDir = appSupportURL.appendingPathComponent("updates")

      if !fileManager.fileExists(atPath: updatesDir.path) {
          try? fileManager.createDirectory(at: updatesDir, withIntermediateDirectories: true, attributes: nil)
      }

      return updatesDir
  }

  private func cleanupOldUpdates(in channelDir: URL) {
      let fileManager = FileManager.default
      do {
          let updateDirs = try fileManager.contentsOfDirectory(at: channelDir, includingPropertiesForKeys: [.creationDateKey], options: .skipsHiddenFiles)

          if updateDirs.count > 3 {
              let sortedDirs = updateDirs.sorted {
                  let date1 = (try? $0.resourceValues(forKeys: [.creationDateKey]))?.creationDate ?? Date.distantPast
                  let date2 = (try? $1.resourceValues(forKeys: [.creationDateKey]))?.creationDate ?? Date.distantPast
                  return date1.compare(date2) == .orderedAscending
              }

              let dirToRemove = sortedDirs.first!
              try fileManager.removeItem(at: dirToRemove)
          }
      } catch {
          print("Error cleaning up old updates: \(error)")
      }
  }

  @objc(setUpdateChannel:resolver:rejecter:)
  func setUpdateChannel(channelName: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    UserDefaults.standard.set(channelName, forKey: "updateChannel")
    resolve(nil)
  }

  @objc(markUpdateAsGood:rejecter:)
  func markUpdateAsGood(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    UserDefaults.standard.removeObject(forKey: "isUpdatePendingVerification")
    resolve(nil)
  }
}
