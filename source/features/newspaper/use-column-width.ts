import {useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

/** The widest a column of the paper's words is set: past it a line is too long to follow, so a wider window gets wider margins. */
export const READING_WIDTH = 700

/** The width of a Mess page inside its margins: the window, less the side safe areas and the page's margins. */
export function usePageWidth(margin: number): number {
	let {width} = useWindowDimensions()
	let insets = useSafeAreaInsets()
	// The scroll view's content sits inside the side safe areas, which landscape widens.
	return width - insets.left - insets.right - margin * 2
}

/** The width of a Mess page's column of words: the page's, up to the reading width. */
export function useColumnWidth(margin: number): number {
	return Math.min(usePageWidth(margin), READING_WIDTH)
}
