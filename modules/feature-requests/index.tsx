import * as React from 'react'
import {requireNativeView} from 'expo'

export type FeatureRequestsBoardProps = {
	onBack: () => void
}

type NativeProps = {
	onBack: () => void
}

const FeatureRequestsNativeView: React.ComponentType<NativeProps> = requireNativeView(
	'FeatureRequests',
	'FeatureRequestsView',
)

/// KickstartSignal's board, with its own navigation bar. Renders only inside a
/// `Host`: it is a SwiftUI view, not a React Native one.
export function FeatureRequestsBoard({onBack}: FeatureRequestsBoardProps): React.ReactNode {
	return <FeatureRequestsNativeView onBack={onBack} />
}
