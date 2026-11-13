import UIKit

/// EXPERIMENT (do not merge): logs, once a second under --uitesting, every
/// layer in the app's windows that has animations attached, so a run that
/// stalls waiting for "animations idle" names what is still animating.
/// Logs only when the set changes.
enum AnimationProbe {
	private static var timer: Timer?
	private static var lastReport = ""

	static func start() {
		guard ProcessInfo.processInfo.arguments.contains("--uitesting"), timer == nil else { return }
		DispatchQueue.main.async {
			timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in report() }
		}
	}

	private static func describe(_ layer: CALayer) -> String? {
		guard let keys = layer.animationKeys(), !keys.isEmpty else { return nil }
		let owner = layer.delegate.map { String(describing: type(of: $0)) } ?? "-"
		let parts = keys.prefix(6).map { key -> String in
			guard let animation = layer.animation(forKey: key) else { return key }
			let kind = String(describing: type(of: animation))
			let repeatCount = animation.repeatCount
			return "\(key)=\(kind)(d=\(String(format: "%.2f", animation.duration)),r=\(repeatCount == .infinity ? "inf" : String(repeatCount)))"
		}
		return "\(String(describing: type(of: layer)))<\(owner)> \(parts.joined(separator: " "))"
	}

	private static func walk(_ layer: CALayer, depth: Int, into lines: inout [String]) {
		if lines.count > 40 || depth > 60 { return }
		if let line = describe(layer) { lines.append(line) }
		for sublayer in layer.sublayers ?? [] {
			walk(sublayer, depth: depth + 1, into: &lines)
		}
	}

	private static func report() {
		var lines: [String] = []
		var windows: [String] = []
		for scene in UIApplication.shared.connectedScenes {
			guard let windowScene = scene as? UIWindowScene else { continue }
			for window in windowScene.windows {
				windows.append("\(String(describing: type(of: window)))\(window.isHidden ? "(hidden)" : "")")
				walk(window.layer, depth: 0, into: &lines)
			}
		}
		let report = "windows=[\(windows.joined(separator: ","))] animating=\(lines.count)\n" + lines.joined(separator: "\n")
		if report != lastReport {
			lastReport = report
			for line in report.split(separator: "\n") {
				NSLog("%@", "[anim-probe] \(line)" as NSString)
			}
		}
	}
}
