import ExpoModulesCore

public class SomethingSecretModule: Module {
	private let shakeWatch = ShakeWatch()

	public func definition() -> ModuleDefinition {
		Name("SomethingSecret")

		Events("onShakeEscape")

		View(SlabView.self)

		Function("roar") {
			Roar.play()
		}

		AsyncFunction("melt") { () async in
			await Melt.run()
		}

		Function("startShakeWatch") { [weak self] in
			DispatchQueue.main.async {
				self?.shakeWatch.start { self?.sendEvent("onShakeEscape") }
			}
		}

		Function("stopShakeWatch") { [weak self] in
			DispatchQueue.main.async { self?.shakeWatch.stop() }
		}
	}
}
