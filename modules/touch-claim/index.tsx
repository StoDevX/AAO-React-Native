import * as React from 'react'
import type {ViewProps} from 'react-native'
import {requireNativeView} from 'expo'

export type TouchClaimViewProps = ViewProps & {
	/** Whether a touch on the children is kept from a sheet or scroll view around them. */
	claims: boolean
}

const TouchClaimNativeView: React.ComponentType<TouchClaimViewProps> = requireNativeView(
	'TouchClaim',
	'TouchClaimView',
)

/**
 * A view that, while `claims` is on, keeps a sheet or scroll view around it from taking a
 * touch on its children as a drag. React Native's own responder cannot do this: a native
 * pan recognizer begins on its own terms, and cancels the responder when it does.
 */
export function TouchClaimView(props: TouchClaimViewProps): React.ReactNode {
	return <TouchClaimNativeView {...props} />
}
