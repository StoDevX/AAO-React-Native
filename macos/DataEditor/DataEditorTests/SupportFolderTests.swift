import Foundation
import Testing
@testable import DataEditor

@MainActor
struct SupportFolderTests {
    private let applicationSupport = URL(filePath: "/Users/someone/Library/Application Support")

    /// Named by the app's identifier, so no other app named Data Editor shares it.
    @Test func isNamedByTheBundleIdentifier() {
        #expect(AppModel.supportFolder(in: applicationSupport, bundleIdentifier: "com.drewvolz.allaboutolaf-data-editor")
                == applicationSupport.appending(path: "com.drewvolz.allaboutolaf-data-editor"))
    }

    /// A bundle without an identifier still gets the release build's folder.
    @Test func fallsBackToTheReleaseIdentifier() {
        #expect(AppModel.supportFolder(in: applicationSupport, bundleIdentifier: nil)
                == applicationSupport.appending(path: "com.drewvolz.allaboutolaf-data-editor"))
    }
}
