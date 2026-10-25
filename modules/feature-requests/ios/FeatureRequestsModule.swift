import ExpoModulesCore

public class FeatureRequestsModule: Module {
	public func definition() -> ModuleDefinition {
		Name("FeatureRequests")

		View(FeatureRequestsView.self)
	}
}
