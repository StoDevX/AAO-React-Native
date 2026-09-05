import ExpoModulesCore

public class LaunchArgumentsModule: Module {
	public func definition() -> ModuleDefinition {
		Name("LaunchArguments")

		Constants([
			"isUITesting": ProcessInfo.processInfo.arguments.contains("--uitesting")
		])
	}
}
