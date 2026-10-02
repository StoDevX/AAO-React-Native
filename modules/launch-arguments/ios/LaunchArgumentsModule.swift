import ExpoModulesCore

public class LaunchArgumentsModule: Module {
	public func definition() -> ModuleDefinition {
		Name("LaunchArguments")

		let arguments = ProcessInfo.processInfo.arguments
		/// The argument following `flag`, as `--chaos-seed 42` passes 42.
		func value(after flag: String) -> String? {
			guard let index = arguments.firstIndex(of: flag), index + 1 < arguments.count else {
				return nil
			}
			return arguments[index + 1]
		}

		Constants([
			"isUITesting": arguments.contains("--uitesting"),
			// Where a feature with fixtures gets its data: recorded live under
			// --record-fixtures, served from its fixtures under --uitesting,
			// and the network otherwise.
			"fixtureMode": arguments.contains("--record-fixtures")
				? "record" : arguments.contains("--uitesting") ? "serve" : "live",
			// A chaos run: uitests/Chaos drives the app while source/chaos
			// injects faults. See source/chaos/install.ts.
			"isChaos": arguments.contains("--chaos"),
			"chaosSeed": Int(value(after: "--chaos-seed") ?? "") ?? 0,
			"chaosLaunch": Int(value(after: "--chaos-launch") ?? "") ?? 0,
			"chaosMode": arguments.contains("--chaos-replay") ? "replay" : "record",
			"chaosFaultRate": Double(value(after: "--chaos-fault-rate") ?? "") ?? 0.25,
		])
	}
}
