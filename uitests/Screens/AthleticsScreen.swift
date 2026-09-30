import XCTest

struct AthleticsScreen: Screen {
	let app: XCUIApplication

	/// Athletics is a `devOnly` tile, so it is absent from a build that embedded
	/// its bundle -- which is how CI runs, and why enabling dev mode cannot be
	/// left to whoever ran the build. Reaching for the switch only when the tile
	/// is missing keeps this working either way, rather than assuming a state
	/// the previous test may already have left behind.
	@discardableResult
	func navigate() -> Self {
		open(route: "/Athletics", mountedWhen: app.navigationBars["Athletics"])
	}
}
