// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "DataEditorKit",
    platforms: [.macOS("27.0")],
    products: [.library(name: "DataEditorKit", targets: ["DataEditorKit"])],
    targets: [
        .target(name: "DataEditorKit"),
        .testTarget(
            name: "DataEditorKitTests",
            dependencies: ["DataEditorKit"],
            resources: [.copy("Fixtures")]
        ),
    ]
)
