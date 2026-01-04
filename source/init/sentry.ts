import {SENTRY_DSN} from './constants'
import * as Sentry from '@sentry/react-native'
import {IS_PRODUCTION} from '@frogpond/constants'

// Construct a new instrumentation instance. This is needed to communicate between the integration and React
export const routingInstrumentation = Sentry.reactNavigationIntegration()

function install() {
	if (!IS_PRODUCTION) {
		return
	}

	Sentry.init({
		dsn: SENTRY_DSN,

		tracesSampleRate: 0.2,

		tracePropagationTargets: ['localhost', 'frogpond.tech', /^\//u],

		integrations: [
			routingInstrumentation,
			Sentry.reactNativeTracingIntegration(),
		],
	})
}

install()
