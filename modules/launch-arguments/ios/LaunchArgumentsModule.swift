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
		])
	}
}
