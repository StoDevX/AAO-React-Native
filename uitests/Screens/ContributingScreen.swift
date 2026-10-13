import XCTest

/// Home's ⋯ menu → Contributing: the source code, feedback, OpenStreetMap, the
/// data sources and a way to email us.
struct ContributingScreen: Screen {
	let app: XCUIApplication

	var host: XCUIElement { app.element(matching: TestIdentifiers.Contributing.screen) }
}
