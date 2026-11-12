import * as React from 'react'
import {Platform} from 'react-native'
import {requireNativeView} from 'expo'

export type FeatureRequestsBoardProps = {
	onBack: () => void
}

type NativeProps = {
	onBack: () => void
}

/**
 * Whether this platform has the board. KickstartSignal ships for iOS alone, so
 * on Android the module's view only says the board is not there.
 */
export const isFeatureRequestsAvailable: boolean = Platform.OS === 'ios'

const FeatureRequestsNativeView: React.ComponentType<NativeProps> = requireNativeView(
	'FeatureRequests',
	'FeatureRequestsView',
)

/// KickstartSignal's board, with its own navigation bar. Renders only inside a
/// `Host`: it is a SwiftUI view, not a React Native one.
export function FeatureRequestsBoard({onBack}: FeatureRequestsBoardProps): React.ReactNode {
	return <FeatureRequestsNativeView onBack={onBack} />
}
