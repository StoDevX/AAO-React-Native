// swift-tools-version: 6.0
import PackageDescription

let package = Package(
	name: "RadioCaptions",
	platforms: [.iOS("26.0"), .macOS("26.0")],
	products: [
		.library(name: "RadioCaptionEngine", targets: ["RadioCaptionEngine"])
	],
	targets: [
		// The same files the Expo module's pod compiles, so the engine is tested on the Mac
		// without React Native.
		.target(name: "RadioCaptionEngine", path: "ios/Engine"),
		.testTarget(
			name: "RadioCaptionEngineTests",
			dependencies: ["RadioCaptionEngine"],
			path: "Tests/RadioCaptionEngineTests"
		),
	],
	swiftLanguageModes: [.v5]
)
