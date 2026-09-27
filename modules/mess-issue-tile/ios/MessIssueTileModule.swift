import ExpoModulesCore

public class MessIssueTileModule: Module {
	public func definition() -> ModuleDefinition {
		Name("MessIssueTile")

		View(MessIssueTileView.self)
	}
}
