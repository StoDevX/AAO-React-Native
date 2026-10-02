import * as React from 'react'
import type {NativeSyntheticEvent, ViewProps} from 'react-native'
import {requireNativeView} from 'expo'

/** A point in the view's own coordinates, in points. */
export type DoubleTapPoint = {x: number; y: number}

export type DoubleTapViewProps = ViewProps & {
	/** Called on a double tap, with where it landed. */
	onDoubleTap: (point: DoubleTapPoint) => void
}

type NativeProps = ViewProps & {
	onDoubleTap: (event: NativeSyntheticEvent<DoubleTapPoint>) => void
}

const DoubleTapNativeView: React.ComponentType<NativeProps> = requireNativeView(
	'DoubleTap',
	'DoubleTapView',
)

/**
 * A view that reports a double tap on its children, counted by UIKit's own tap recognizer
 * rather than by timing two presses, which React Native cannot deliver when they come close.
 */
export function DoubleTapView({onDoubleTap, ...rest}: DoubleTapViewProps): React.ReactNode {
	return (
		<DoubleTapNativeView
			{...rest}
			onDoubleTap={(event) => onDoubleTap({x: event.nativeEvent.x, y: event.nativeEvent.y})}
		/>
	)
}
