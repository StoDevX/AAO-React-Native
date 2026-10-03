import * as React from 'react'
import type {LayoutChangeEvent} from 'react-native'

/**
 * Props for a scroll view around the player, which scrolls only when the
 * player is taller than the scroll view: at large text sizes, or on a small
 * phone. A scroll view that always scrolled would take every drag on it, and
 * a sheet around it could not be swiped away.
 */
export function useFitOrScroll(): {
	/** The scroll view's own height, which the player fits itself to. */
	viewport: number
	scrollEnabled: boolean
	onLayout: (event: LayoutChangeEvent) => void
	onContentSizeChange: (width: number, height: number) => void
} {
	let [viewport, setViewport] = React.useState(0)
	let [contentHeight, setContentHeight] = React.useState(0)
	return {
		viewport,
		scrollEnabled: contentHeight > viewport,
		onLayout: (event) => setViewport(event.nativeEvent.layout.height),
		onContentSizeChange: (_width, height) => setContentHeight(height),
	}
}
