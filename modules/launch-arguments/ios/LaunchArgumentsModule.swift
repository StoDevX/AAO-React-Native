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
			// A chaos run: uitests/Chaos drives the app while source/chaos
			// injects faults. See source/chaos/install.ts.
			"isChaos": arguments.contains("--chaos"),
			"chaosSeed": Int(Self.value(after: "--chaos-seed") ?? "") ?? 0,
			"chaosLaunch": Int(Self.value(after: "--chaos-launch") ?? "") ?? 0,
			"chaosMode": arguments.contains("--chaos-replay") ? "replay" : "record",
			"chaosFaultRate": Double(Self.value(after: "--chaos-fault-rate") ?? "") ?? 0.25,
			"chaosProfile": Self.value(after: "--chaos-profile") == "session" ? "session" : "fuzz",
			// What the binary was built as. NODE_ENV only says how the JS was
			// bundled, and local builds embed a release bundle too.
			"isSimulator": Self.isSimulator,
			"isDebugNativeBuild": Self.isDebugNativeBuild,
		])
	}

	#if targetEnvironment(simulator)
	private static let isSimulator = true
	#else
	private static let isSimulator = false
	#endif

	#if DEBUG
	private static let isDebugNativeBuild = true
	#else
	private static let isDebugNativeBuild = false
	#endif

	/// The argument following `flag`, as `--chaos-seed 42` passes 42. Outside
	/// `definition()` because its result builder accepts no local functions.
	private static func value(after flag: String) -> String? {
		let arguments = ProcessInfo.processInfo.arguments
		guard let index = arguments.firstIndex(of: flag), index + 1 < arguments.count else {
			return nil
		}
		return arguments[index + 1]
	}
}
