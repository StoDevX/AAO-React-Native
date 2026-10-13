import ExpoModulesCore
import UIKit

/// The display link retains its target; the proxy keeps the view's lifetime independent.
private final class VisualizerDisplayLink {
	weak var view: RadioVisualizerView?
	init(_ view: RadioVisualizerView) { self.view = view }
	@objc func tick(_ link: CADisplayLink) { view?.tick(link.timestamp) }
}

/// Draws only reduced analysis frames. PCM and display frames never cross the JS bridge.
final class RadioVisualizerView: ExpoView {
	var provider: (() -> AudioVisualization?)?
	var active = false
	var mode = "waveform" {
		didSet {
			guard oldValue != mode else { return }
			accessibilityLabel = mode == "spectrum" ? "Audio spectrum" : "Audio waveform"
			if !UIAccessibility.isReduceMotionEnabled {
				let transition = CATransition()
				transition.type = .fade
				transition.duration = 0.16
				layer.add(transition, forKey: "visualizerMode")
			}
			setNeedsDisplay()
		}
	}
	var signalColor = UIColor.white { didSet { setNeedsDisplay() } }
	private let subscription = UUID()
	private var visualization: AudioVisualization?
	private var displayLink: CADisplayLink?
	private var observers: [NSObjectProtocol] = []
	private var displayFrame = VisualizationFrame()
	private var spectrum = VisualizationTransition()
	private var position = VisualizationTransition()
	private var time = 0.0
	private var foreground = true

	required init(appContext: AppContext? = nil) {
		super.init(appContext: appContext)
		backgroundColor = .clear
		isOpaque = false
		isUserInteractionEnabled = false
		isAccessibilityElement = true
		accessibilityLabel = "Audio waveform"
		accessibilityTraits = .image
		contentMode = .redraw
		foreground = UIApplication.shared.applicationState != .background
		for name in [UIApplication.didEnterBackgroundNotification, UIApplication.didBecomeActiveNotification,
			UIAccessibility.reduceMotionStatusDidChangeNotification] {
			observers.append(NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) { [weak self] notification in
				guard let self else { return }
				if notification.name == UIApplication.didEnterBackgroundNotification { self.foreground = false }
				if notification.name == UIApplication.didBecomeActiveNotification { self.foreground = true }
				self.updateActivity()
			})
		}
	}

	override func didMoveToWindow() {
		super.didMoveToWindow()
		updateActivity()
	}

	func updateActivity() {
		let running = active && foreground && window != nil
		guard running else {
			displayLink?.invalidate()
			displayLink = nil
			bind(nil)
			return
		}
		if displayLink == nil {
			let link = CADisplayLink(target: VisualizerDisplayLink(self), selector: #selector(VisualizerDisplayLink.tick(_:)))
			link.add(to: .main, forMode: .common)
			displayLink = link
		}
		displayLink?.preferredFrameRateRange = UIAccessibility.isReduceMotionEnabled
			? CAFrameRateRange(minimum: 10, maximum: 10, preferred: 10)
			: CAFrameRateRange(minimum: 30, maximum: 120, preferred: 120)
		bind(provider?())
	}

	private func bind(_ next: AudioVisualization?) {
		guard visualization !== next else { return }
		visualization?.unsubscribe(subscription)
		visualization = next
		next?.subscribe(subscription)
		displayFrame = VisualizationFrame()
		spectrum = VisualizationTransition()
		position = VisualizationTransition()
		setNeedsDisplay()
	}

	fileprivate func tick(_ timestamp: Double) {
		time = timestamp
		bind(provider?())
		if let next = visualization?.frame(), next.sequence != displayFrame.sequence {
			if next.revision != displayFrame.revision || next.columns < displayFrame.columns {
				spectrum = VisualizationTransition()
				position = VisualizationTransition()
				position.retarget([Float(next.columns)], at: timestamp - 1, duration: 1.0 / 30)
			}
			let duration = displayFrame.time > 0 ? min(0.15, max(1.0 / 30, next.time - displayFrame.time)) : 1.0 / 30
			spectrum.retarget(next.bands, at: timestamp, duration: duration)
			position.retarget([Float(next.columns)], at: timestamp, duration: duration)
			displayFrame = next
		}
		setNeedsDisplay()
	}

	override func draw(_ rect: CGRect) {
		guard let context = UIGraphicsGetCurrentContext(), bounds.width > 0 else { return }
		context.setFillColor(signalColor.cgColor)
		context.setStrokeColor(signalColor.withAlphaComponent(0.2).cgColor)
		context.setLineWidth(1)
		let reduced = UIAccessibility.isReduceMotionEnabled
		if mode == "spectrum" {
			let values = reduced ? displayFrame.bands : spectrum.value(at: time)
			let step = bounds.width / CGFloat(VisualizationAnalysis.bandCount)
			for (i, value) in values.enumerated() {
				let height = max(1, CGFloat(value) * (bounds.height - 2))
				let bar = CGRect(x: CGFloat(i) * step, y: bounds.height - height,
					width: max(1, step - 3), height: height)
				context.addPath(UIBezierPath(roundedRect: bar, cornerRadius: 1).cgPath)
			}
			context.fillPath()
		} else {
			context.move(to: CGPoint(x: 0, y: bounds.midY))
			context.addLine(to: CGPoint(x: bounds.width, y: bounds.midY))
			context.strokePath()
			let end = reduced ? Float(displayFrame.columns) : (position.value(at: time).first ?? 0)
			let points = max(2, Int(bounds.width / 3))
			for i in 0..<points {
				let column = Double(end) - 240 + Double(i) * 240 / Double(points - 1)
				let index = column - Double(displayFrame.columns - VisualizationAnalysis.historyCount)
				let lower = Int(floor(index))
				guard lower >= 0, lower + 1 < displayFrame.waveform.count else { continue }
				let fraction = Float(index - Double(lower))
				let amplitude = displayFrame.waveform[lower] * (1 - fraction) + displayFrame.waveform[lower + 1] * fraction
				let height = max(1, CGFloat(amplitude) * (bounds.height - 2))
				context.fill(CGRect(x: CGFloat(i) * bounds.width / CGFloat(points),
					y: bounds.midY - height / 2, width: 1.5, height: height))
			}
		}
	}

	deinit {
		displayLink?.invalidate()
		visualization?.unsubscribe(subscription)
		for observer in observers { NotificationCenter.default.removeObserver(observer) }
	}
}
