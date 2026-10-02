import * as React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {isChaos} from '@frogpond/launch-arguments'

import {reportFinding, useChaosFindings} from './findings'
import {BEACON_ID, BEACON_QUIET, FATAL_BOUNDARY_ID} from './identifiers'

/** The first stopping finding, as a label the monkey reads after every step. */
function ChaosBeacon(): React.ReactNode {
	let latest = useChaosFindings((state) => state.latest)
	return (
		<View
			accessibilityLabel={latest || BEACON_QUIET}
			accessible={true}
			pointerEvents="none"
			style={styles.beacon}
			testID={BEACON_ID}
		/>
	)
}

type BoundaryState = {failed: boolean}

/**
 * Catches a render error under chaos and reports it. Without this a render
 * error unmounts the whole tree, beacon included, and a release bundle turns
 * it into a crash with no message.
 */
class FatalBoundary extends React.Component<{children: React.ReactNode}, BoundaryState> {
	state: BoundaryState = {failed: false}

	static getDerivedStateFromError(): BoundaryState {
		return {failed: true}
	}

	componentDidCatch(error: unknown): void {
		reportFinding('fatal', error)
	}

	render(): React.ReactNode {
		if (this.state.failed) {
			return <Text testID={FATAL_BOUNDARY_ID}>A chaos run hit a render error.</Text>
		}
		return this.props.children
	}
}

/** `ChaosGuard`, with whether this is a chaos run passed in. */
export function ChaosGuardFor(props: {
	isChaos: boolean
	children: React.ReactNode
}): React.ReactNode {
	if (!props.isChaos) {
		return props.children
	}
	return (
		<>
			<FatalBoundary>{props.children}</FatalBoundary>
			<ChaosBeacon />
		</>
	)
}

/** Wraps the app in a chaos run, and is a pass-through otherwise. */
export function ChaosGuard(props: {children: React.ReactNode}): React.ReactNode {
	return <ChaosGuardFor isChaos={isChaos}>{props.children}</ChaosGuardFor>
}

const styles = StyleSheet.create({
	// Present in the accessibility tree but never drawn or touched. If
	// XCUITest cannot see a fully transparent view, the canary in
	// uitests/Chaos fails; raise opacity to 0.02 then.
	beacon: {position: 'absolute', top: 0, left: 0, width: 1, height: 1, opacity: 0},
})
