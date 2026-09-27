import ExpoModulesCore

public class PlaceCardHeaderModule: Module {
	public func definition() -> ModuleDefinition {
		Name("PlaceCardHeader")

		View(PlaceCardHeaderView.self)
		View(PlaceCardScaffoldView.self)
		View(PlaceCardAboutView.self)
	}
}
