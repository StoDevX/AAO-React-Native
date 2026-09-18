import {useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

/**
 * The horizontal margin an inset-grouped section leaves at each side, on top
 * of the safe area.
 */
const SECTION_HORIZONTAL_INSET = 20

/**
 * The width of the card an inset-grouped `List` draws, for the timetable
 * hosted inside it.
 *
 * The hosted timetable needs an explicit width: `matchContents` lays hosted
 * content out against an unbounded constraint, so a subtree sized by `flex`
 * ends up with frames thousands of points wide -- drawn correctly by SwiftUI,
 * but untappable and unreadable to the UI tests. Taking the width from the
 * viewport rather than from the host keeps the measurement from being
 * circular.
 *
 * The safe-area insets come off as well: in landscape on a notched iPhone, the
 * `List` insets its card by them on top of `SECTION_HORIZONTAL_INSET`, and the
 * hosted view would otherwise overflow the card.
 */
export function useTimetableWidth(): number {
	let {width} = useWindowDimensions()
	let insets = useSafeAreaInsets()
	return width - 2 * SECTION_HORIZONTAL_INSET - insets.left - insets.right
}
