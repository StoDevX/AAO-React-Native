import ExpoModulesCore
import SwiftUI

// Apple Maps' place-card header, measured on an iPhone 17 Pro simulator running
// iOS 27 on 2026-09-24 and 25. All in the sheet's own layout points: UIKit
// scales the whole sheet by its stop, so these need no scaling of their own.
// See `.superpowers/specs/2026-09-24-map-building-card-header-design.md`.

/// Maps' header buttons, and the gap between a button and the title.
private let buttonSize: CGFloat = 44
private let buttonGap: CGFloat = 16
/// How far the title slot sits in from each side of this view.
private let titleInset: CGFloat = buttonSize + buttonGap
/// Maps draws its moving title 8pt further in than the slot on each side, a
/// 234pt box on a 402pt card.
private let marqueeInset: CGFloat = 8
/// Maps sets the title's top about 1.7pt below the buttons' top.
private let titleTopOffset: CGFloat = 1.7

/// First pass after the view appears, and the cycle after that.
private let firstPass: Duration = .seconds(6)
private let cycle: Duration = .seconds(60)
/// The left edge's fade appears this long before the name starts to move.
private let leadIn: Duration = .milliseconds(1400)
/// Points per second.
private let speed: CGFloat = 30
/// Space between the end of the name and the copy that follows it round.
private let gap: CGFloat = 40
private let leadingFade: CGFloat = 8
private let trailingFade: CGFloat = 48

final class PlaceCardHeaderProps: ExpoSwiftUI.ViewProps {
	@Field var title: String = ""
	@Field var subtitle: String?
	/// True at the stops where Maps lets a long name move. The view still
	/// decides for itself whether the name is long enough to need it.
	@Field var animate: Bool = false
	@Field var testID: String?
}

/// The title and subtitle of a place card, laid out as Maps lays them out
/// between its header buttons. The buttons themselves are not drawn here; the
/// caller layers its own over this view's top corners.
///
/// VoiceOver reads one element: the whole title, then the subtitle, however
/// much of either is on screen.
struct PlaceCardHeaderView: ExpoSwiftUI.View {
	@ObservedObject var props: PlaceCardHeaderProps

	init(props: PlaceCardHeaderProps) {
		self.props = props
	}

	@State private var titleHeight: CGFloat = 0

	/// The subtitle's top is the title's bottom; while that is above the
	/// buttons' bottom edge the subtitle sits beside them and keeps to the
	/// title's slot.
	private var subtitleBesideButtons: Bool {
		titleTopOffset + titleHeight < buttonSize
	}

	private var subtitle: String? {
		props.subtitle.flatMap { $0.isEmpty ? nil : $0 }
	}

	var body: some View {
		VStack(spacing: 0) {
			MarqueeTitle(props: props)
				.padding(.horizontal, titleInset + marqueeInset)
				.onGeometryChange(for: CGFloat.self) { $0.size.height } action: { titleHeight = $0 }
			if let subtitle {
				Text(subtitle)
					.font(.subheadline.weight(.semibold))
					.foregroundStyle(.secondary)
					.lineLimit(1)
					.truncationMode(.tail)
					.padding(.horizontal, subtitleBesideButtons ? titleInset : 0)
			}
		}
		// A title with no subtitle under it centres on the buttons, as Maps
		// centres a place with no category.
		.padding(.top, subtitle == nil ? 0 : titleTopOffset)
		.frame(
			maxWidth: .infinity,
			minHeight: subtitle == nil ? buttonSize : nil,
			alignment: subtitle == nil ? .center : .top)
		// The element is a clear layer over the header, not the header with
		// its children ignored: an element built from the header takes its
		// frame from the marquee's moving copies, which run far past the card.
		.accessibilityHidden(true)
		.overlay {
			Color.clear
				.accessibilityElement()
				.accessibilityLabel([props.title, subtitle].compactMap { $0 }.joined(separator: ", "))
				.accessibilityIdentifier(props.testID ?? "")
		}
	}
}

/// One line of `title3` bold that fills the width it is offered. A title that
/// fits is drawn plainly and centred. One that does not fades out at the
/// right edge, and while `animate` is on, makes a seamless pass on Maps'
/// cycle: it slides left while a copy follows `gap` behind, until the copy
/// stands where the title started, then snaps back to the start, which looks
/// identical.
private struct MarqueeTitle: View {
	@ObservedObject var props: PlaceCardHeaderProps

	@Environment(\.accessibilityReduceMotion) private var reduceMotion
	@State private var textWidth: CGFloat = 0
	@State private var boxWidth: CGFloat = 0
	@State private var offset: CGFloat = 0
	@State private var moving = false

	private var overflows: Bool {
		boxWidth > 0 && textWidth > boxWidth
	}

	/// The title at its natural width, never truncated.
	private var label: some View {
		Text(props.title)
			.font(.title3.bold())
			.lineLimit(1)
			.fixedSize()
	}

	var body: some View {
		// A truncating copy, hidden, gives the line its height and takes the
		// offered width; the visible title is an overlay, so it can be as wide
		// as it likes without widening the header.
		Text(props.title)
			.font(.title3.bold())
			.lineLimit(1)
			.hidden()
			.frame(maxWidth: .infinity)
			.onGeometryChange(for: CGFloat.self) { $0.size.width } action: { boxWidth = $0 }
			.overlay(alignment: overflows ? .leading : .center) {
				HStack(spacing: gap) {
					label
						.onGeometryChange(for: CGFloat.self) { $0.size.width } action: { textWidth = $0 }
					if overflows {
						label
					}
				}
				.offset(x: offset)
			}
			.mask { fade }
			// Drawn flat. Without this the masked title vanished for one frame
			// as its first pass started (3 recordings of 3; none of 2 with
			// it, none with the mask removed). Why is not known; this was
			// chosen by that experiment.
			.drawingGroup()
			.task(id: Cycle(title: props.title, overflows: overflows, reduceMotion: reduceMotion)) {
				await run()
			}
			.onChange(of: props.animate) { _, animate in
				// The clock keeps running; a stop that forbids motion only
				// cuts short a pass in progress.
				if !animate { rest() }
			}
	}

	@ViewBuilder private var fade: some View {
		if overflows {
			GeometryReader { box in
				let width = max(box.size.width, 1)
				LinearGradient(
					stops: [
						.init(color: .clear, location: 0),
						.init(color: .black, location: (moving ? leadingFade : 0) / width),
						.init(color: .black, location: 1 - trailingFade / width),
						.init(color: .clear, location: 1),
					],
					startPoint: .leading,
					endPoint: .trailing)
			}
		} else {
			Rectangle()
		}
	}

	/// What restarts the cycle from its first pass. A stop change is not in
	/// here, because Maps does not restart on one.
	private struct Cycle: Equatable {
		let title: String
		let overflows: Bool
		let reduceMotion: Bool
	}

	private func rest() {
		var still = Transaction()
		still.disablesAnimations = true
		withTransaction(still) {
			offset = 0
			moving = false
		}
	}

	private func run() async {
		rest()
		guard overflows, !reduceMotion else { return }

		let clock = ContinuousClock()
		var next = clock.now + firstPass
		while !Task.isCancelled {
			do { try await clock.sleep(until: next - leadIn) } catch { return }
			if props.animate {
				withAnimation { moving = true }
				do { try await clock.sleep(for: leadIn) } catch { return }
				// Read again: the stop may have changed during the lead-in.
				if props.animate {
					let distance = textWidth + gap
					let duration = Double(distance / speed)
					withAnimation(.linear(duration: duration)) { offset = -distance }
					do { try await clock.sleep(for: .seconds(duration)) } catch { return }
				}
				rest()
			}
			next += cycle
		}
	}
}
