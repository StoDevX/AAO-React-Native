import ExpoModulesCore

public class LaunchArgumentsModule: Module {
	public func definition() -> ModuleDefinition {
		Name("LaunchArguments")

		let arguments = ProcessInfo.processInfo.arguments
		Constants([
			"isUITesting": arguments.contains("--uitesting"),
			// Where a feature with fixtures gets its data: recorded live under
			// --record-fixtures, served from its fixtures under --uitesting,
			// and the network otherwise.
			"fixtureMode": arguments.contains("--record-fixtures")
				? "record" : arguments.contains("--uitesting") ? "serve" : "live",
			// Where the home screen's secret slab starts, so a UI test can photograph a stage
			// without tapping its way there: --secret-progress=120.
			"secretProgress": arguments.lazy
				.compactMap { $0.hasPrefix("--secret-progress=") ? Int($0.dropFirst("--secret-progress=".count)) : nil }
				.first ?? 0,
		])
	}
}
