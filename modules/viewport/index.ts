import type React from 'react'
import {ScaledSize, useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

type Props = {
	render: (dimensions: ScaledSize) => React.ReactNode
}

export let Viewport = (props: Props): React.ReactNode => {
	let viewport = useWindowDimensions()
	return props.render(viewport)
}

/**
 * How wide React Native content hosted inside a `matchContents` `RNHostView`
 * should be drawn, in points.
 *
 * Such a host sizes itself to its content, so the content cannot take its own
 * width back from the host: measuring there asks a question whose answer
 * depends on the answer, and `RNHostView` replies with an unbounded width. A
 * flex child then stretches to it and the row lays out thousands of points
 * wide -- drawn off both edges of the screen, while every test still passes.
 *
 * The screen minus its safe area is the one width that is not downstream of
 * the content's own size. It assumes the hosted content spans the screen,
 * which is true of every host that uses this; a host inset from the edges
 * should subtract its own insets from the result.
 */
export function useHostedContentWidth(): number {
	let {width} = useWindowDimensions()
	let insets = useSafeAreaInsets()
	return width - insets.left - insets.right
}
