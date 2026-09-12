import ExpoModulesCore

public class ResearchKitSurveyModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ResearchKitSurvey")

        AsyncFunction("presentSurvey") { (definition: [String: Any], promise: Promise) in
            SurveyPresenter.shared.present(definition: definition, promise: promise)
        }

        AsyncFunction("cancelSurvey") { (promise: Promise) in
            DispatchQueue.main.async {
                SurveyPresenter.shared.cancel()
                promise.resolve(nil)
            }
        }
    }
}
