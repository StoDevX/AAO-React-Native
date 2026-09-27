import {useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

/** The width of a Mess page's column: the window, less the side safe areas and the page's margins. */
export function useColumnWidth(margin: number): number {
	let {width} = useWindowDimensions()
	let insets = useSafeAreaInsets()
	// The scroll view's content sits inside the side safe areas, which landscape widens.
	return width - insets.left - insets.right - margin * 2
}
