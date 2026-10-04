import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {isChaos} from '@frogpond/launch-arguments'
import {describeError, NoticeView} from '@frogpond/notice'

import {reportFinding, useChaosFindings} from './findings'
import {BEACON_ID, BEACON_QUIET, FATAL_BOUNDARY_ID, NETWORK_ID} from './identifiers'
import {networkLabel, useChaosNetwork} from './network'

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

/** Whether a session has the network, as a label the monkey reads to time a stuck spinner. */
function ChaosNetwork(): React.ReactNode {
	let offline = useChaosNetwork((state) => state.offline)
	return (
		<View
			accessibilityLabel={networkLabel(offline)}
			accessible={true}
			pointerEvents="none"
			style={styles.beacon}
			testID={NETWORK_ID}
		/>
	)
}

type BoundaryState = {error: unknown; failed: boolean}

/**
 * Catches a render error under chaos and reports it. Without this a render
 * error unmounts the whole tree, beacon included, and a release bundle turns
 * it into a crash with no message.
 */
class FatalBoundary extends React.Component<{children: React.ReactNode}, BoundaryState> {
	state: BoundaryState = {error: null, failed: false}

	static getDerivedStateFromError(error: unknown): BoundaryState {
		return {error, failed: true}
	}

	componentDidCatch(error: unknown): void {
		reportFinding('fatal', error)
	}

	render(): React.ReactNode {
		// The error's own message, so a chaos run's screenshot says what broke.
		if (this.state.failed) {
			return (
				<View style={styles.fallback} testID={FATAL_BOUNDARY_ID}>
					<NoticeView
						description={describeError(this.state.error)}
						systemImage="exclamationmark.triangle"
						title="Render Error"
					/>
				</View>
			)
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
			<ChaosNetwork />
		</>
	)
}

/** Wraps the app in a chaos run, and is a pass-through otherwise. */
export function ChaosGuard(props: {children: React.ReactNode}): React.ReactNode {
	return <ChaosGuardFor isChaos={isChaos}>{props.children}</ChaosGuardFor>
}

const styles = StyleSheet.create({
	// Present in the accessibility tree but never touched, and too faint to
	// notice. Not fully transparent: iOS leaves a view with opacity 0 out of
	// the accessibility tree, so XCUITest could not read it.
	beacon: {position: 'absolute', top: 0, left: 0, width: 1, height: 1, opacity: 0.02},
	fallback: {flex: 1},
})
