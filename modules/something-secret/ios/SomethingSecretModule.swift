import ExpoModulesCore

public class SomethingSecretModule: Module {
	public func definition() -> ModuleDefinition {
		Name("SomethingSecret")

		View(SlabView.self)

		Function("roar") {
			Roar.play()
		}
	}
}
