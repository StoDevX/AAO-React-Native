import type {PresentationDetent} from '@expo/ui/swift-ui/modifiers'

/**
 * How tall a detent actually is, which the camera needs so it can keep that
 * much of the map clear.
 *
 * Read structurally rather than by identity: the sheet hands its selection back
 * through `onSelectionChange`, and nothing promises that is the same object we
 * passed in -- the native side builds a fresh dictionary.
 *
 * `available` is the height a fraction is measured against, which UIKit calls
 * the maximum detent value: the window less the top inset, not the window. A
 * sheet can never cover the status bar, so measuring against the full window
 * over-pads the camera by the inset's share of the fraction.
 */
export function sheetHeightFor(detent: PresentationDetent, available: number): number {
	if (detent === 'large') {
		return available
	}
	if (detent === 'medium') {
		return available / 2
	}
	if ('fraction' in detent) {
		return available * detent.fraction
	}
	return detent.height
}
