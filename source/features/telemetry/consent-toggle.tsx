import * as React from 'react'
import {Toggle} from '@expo/ui/swift-ui'

import {setTelemetryConsent} from '../../init/sentry'
import {useTelemetryStore} from './store'

/** The Settings switch for anonymous usage and crash data, on by default. */
export function ShareTelemetryToggle(): React.ReactNode {
	let enabled = useTelemetryStore((state) => state.enabled)

	return (
		<Toggle
			isOn={enabled}
			label="Share anonymous usage and crash data"
			onIsOnChange={(shared) => void setTelemetryConsent(shared)}
		/>
	)
}
