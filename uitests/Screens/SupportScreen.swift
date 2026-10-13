import XCTest

/// Home's ⋯ menu → Support: FAQs, Notices, emergency contacts, feedback, and
/// the telemetry switch.
struct SupportScreen: Screen {
	let app: XCUIApplication

	var host: XCUIElement { app.element(matching: TestIdentifiers.Support.screen) }
}
