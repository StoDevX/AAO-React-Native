import * as React from 'react'
import type {ViewProps} from 'react-native'
import {requireNativeView} from 'expo'

export type DragToDismissViewProps = ViewProps & {
	/** Called once, when a drag has carried the children far or fast enough to go. */
	onDismiss: () => void
	/** Called as a drag picks the children up. */
	onDragStart?: () => void
	/** Called when a drag lets go short of dismissing, as the children spring back. */
	onDragCancel?: () => void
}

const DragToDismissNativeView: React.ComponentType<DragToDismissViewProps> = requireNativeView(
	'DragToDismiss',
	'DragToDismissView',
)

/**
 * A view whose children a vertical drag carries away, fading its background as they go,
 * as Photos does with a picture. A drag starts only while any scroll view inside is at
 * its smallest zoom, so a zoomed picture pans instead.
 */
export function DragToDismissView(props: DragToDismissViewProps): React.ReactNode {
	return <DragToDismissNativeView {...props} />
}
