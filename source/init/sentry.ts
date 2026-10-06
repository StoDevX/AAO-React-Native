import * as Sentry from '@sentry/react-native'
import {isDebugBuild} from '@frogpond/constants'

import {SENTRY_DSN} from './constants'
import {IS_REPORTING_BUILD} from './reporting-build'
import {privacyOptions} from './sentry-options'
import {useTelemetryStore} from '../features/telemetry/store'

// Construct a new navigation integration instance. This is needed to communicate between the integration and React
export const navigationIntegration = Sentry.reactNavigationIntegration()

/** A `Sentry.close()` still in flight. A restart waits for it, so the last choice wins. */
let closing: Promise<void> = Promise.resolve()

function isConsented(): boolean {
	return useTelemetryStore.getState().enabled
}

function start(): void {
	// Always init, even when nothing may be sent, so that Sentry.wrap() in
	// app/_layout.tsx has a client to attach to. `enabled` suppresses sending.
	Sentry.init({
		dsn: SENTRY_DSN,
		...privacyOptions({
			isProduction: IS_REPORTING_BUILD,
			consented: isConsented(),
			isPrerelease: isDebugBuild(),
			isConsented,
		}),
		// A disabled native SDK still installs its crash and hang trackers, and
		// still flushes reports saved on disk when it starts.
		enableNative: IS_REPORTING_BUILD,

		tracesSampleRate: 0.2,
		profilesSampleRate: 0.1,
		enableMetricKit: true,
		// Off: interaction spans are named after the text under the finger.
		enableUserInteractionTracing: false,
		enableCaptureFailedRequests: true,

		tracePropagationTargets: ['localhost', 'frogpond.tech', /^\//u],

		integrations: [navigationIntegration, Sentry.hermesProfilingIntegration()],
	})

	let deviceId = useTelemetryStore.getState().ensureDeviceId()
	if (deviceId) {
		Sentry.setUser({id: deviceId})
	}
}

/**
 * Applies the "Share anonymous usage and crash data" switch. Turning it off
 * closes Sentry, which shuts the native SDK too: native crash reports never
 * pass through the JS `beforeSend`, so closing is the only way to stop them.
 */
export async function setTelemetryConsent(shared: boolean): Promise<void> {
	if (shared) {
		useTelemetryStore.getState().optIn()
		await closing
		start()
	} else {
		useTelemetryStore.getState().optOut()
		closing = Sentry.close()
		await closing
	}
}

start()
