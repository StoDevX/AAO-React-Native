import * as React from 'react'
import type {NativeSyntheticEvent, ViewProps} from 'react-native'
import {requireNativeView} from 'expo'

/** A point in the view's own coordinates, in points. */
export type DoubleTapPoint = {x: number; y: number}

export type DoubleTapViewProps = ViewProps & {
	/** Called on a double tap, with where it landed. */
	onDoubleTap: (point: DoubleTapPoint) => void
	/** Called on a single tap, once it is clear no second tap is coming. */
	onSingleTap?: () => void
}

type NativeProps = ViewProps & {
	onDoubleTap: (event: NativeSyntheticEvent<DoubleTapPoint>) => void
	onSingleTap?: () => void
}

const DoubleTapNativeView: React.ComponentType<NativeProps> = requireNativeView(
	'DoubleTap',
	'DoubleTapView',
)

/**
 * A view that reports a double tap on its children, and a single tap that is not the first of
 * two, counted by UIKit's own tap recognizers rather than by timing presses, which React Native
 * cannot deliver when they come close.
 */
export function DoubleTapView({
	onDoubleTap,
	onSingleTap,
	...rest
}: DoubleTapViewProps): React.ReactNode {
	return (
		<DoubleTapNativeView
			{...rest}
			onDoubleTap={(event) => onDoubleTap({x: event.nativeEvent.x, y: event.nativeEvent.y})}
			onSingleTap={onSingleTap ? () => onSingleTap() : undefined}
		/>
	)
}
