import ExpoModulesCore

public class CampusSearchBarModule: Module {
	public func definition() -> ModuleDefinition {
		Name("CampusSearchBar")

		View(CampusSearchBarView.self)
	}
}
