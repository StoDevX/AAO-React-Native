import ExpoModulesCore

public class SelectableTextModule: Module {
	public func definition() -> ModuleDefinition {
		Name("SelectableText")

		View(SelectableTextView.self)
	}
}
