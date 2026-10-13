import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import {Section, Text, Toggle} from '@expo/ui/swift-ui'
import {
	isDebugSwiftAvailable,
	isDebugSwiftEnabled,
	isDebugSwiftRunning,
	openDebugSwift,
	setDebugSwiftEnabled,
} from '@frogpond/debug-tools'

import {ActionRow} from '../../components/rows'
import {refreshFloatingButton} from './floating-button'
import {useDeveloperStore} from './store'

// A debugging aid; a failure is worth knowing about, not showing.
const report = (error: unknown) => {
	Sentry.captureException(error)
}

const onOpenDebugSwift = () => {
	openDebugSwift().catch(report)
}

/**
 * DebugSwift's switch, and while it is on, DebugSwift's network log, view
 * inspector and the rest, and its floating button. Left out of a build without
 * DebugSwift, which a Release build with dev mode on is.
 */
export function DebugSwiftSection(): React.ReactNode {
	let floatingButtonEnabled = useDeveloperStore((state) => state.floatingButtonEnabled)
	let setFloatingButtonEnabled = useDeveloperStore((state) => state.setFloatingButtonEnabled)
	let [enabled, setEnabled] = React.useState(() => isDebugSwiftAvailable && isDebugSwiftEnabled())
	// Whether DebugSwift has instrumented the app, which outlasts the switch
	// being turned off until the app restarts.
	let [running, setRunning] = React.useState(false)

	React.useEffect(() => {
		if (!isDebugSwiftAvailable) {
			return
		}
		let cancelled = false
		isDebugSwiftRunning().then((value) => {
			if (!cancelled) {
				setRunning(value)
			}
		}, report)
		return () => {
			cancelled = true
		}
	}, [])

	const onEnabledChange = (next: boolean) => {
		setEnabled(next)
		setDebugSwiftEnabled(next)
			.then(() => isDebugSwiftRunning())
			.then((value) => {
				setRunning(value)
				// The button's switch may have been left on, and the button can
				// only show now that DebugSwift is running.
				if (next) {
					refreshFloatingButton()
				}
			})
			.catch(report)
	}

	if (!isDebugSwiftAvailable) {
		return null
	}

	let footer =
		!enabled && running ? <Text>DebugSwift stays on until the app restarts.</Text> : undefined

	return (
		<Section footer={footer} title="DebugSwift">
			<Toggle isOn={enabled} label="Enable DebugSwift" onIsOnChange={onEnabledChange} />
			{enabled ? (
				<>
					<ActionRow onPress={onOpenDebugSwift} title="Open DebugSwift" />
					<Toggle
						isOn={floatingButtonEnabled}
						label="Floating Button"
						onIsOnChange={setFloatingButtonEnabled}
					/>
				</>
			) : null}
		</Section>
	)
}
