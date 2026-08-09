import {SENTRY_DSN} from './constants'
import * as Sentry from '@sentry/react-native'
import {IS_PRODUCTION} from '@frogpond/constants'

// Construct a new navigation integration instance. This is needed to communicate between the integration and React
export const navigationIntegration = Sentry.reactNavigationIntegration()

function install() {
	// Always init, even outside production, so that Sentry.wrap() in app.tsx
	// has a client to attach to. `enabled` suppresses actual event reporting.
	Sentry.init({
		dsn: SENTRY_DSN,
		enabled: IS_PRODUCTION,

		tracesSampleRate: 0.2,
		profilesSampleRate: 0.1,
		enableMetricKit: true,

		tracePropagationTargets: ['localhost', 'frogpond.tech', /^\//u],

		integrations: [navigationIntegration, Sentry.hermesProfilingIntegration()],
	})
}

install()
