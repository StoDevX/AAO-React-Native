import {SENTRY_DSN} from './constants'
import {
	init,
	ReactNativeTracing,
	ReactNavigationInstrumentation,
} from '@sentry/react-native'
import {IS_PRODUCTION} from '../modules/constants'

// Construct a new instrumentation instance. This is needed to communicate between the integration and React
export const routingInstrumentation = new ReactNavigationInstrumentation()

function install() {
	if (!IS_PRODUCTION) {
		return
	}

	init({
		dsn: SENTRY_DSN,

		tracesSampleRate: 0.2,

		integrations: [
			new ReactNativeTracing({
				tracingOrigins: ['localhost', 'frogpond.tech', /^\//u],
				routingInstrumentation,
			}),
		],
	})
}

install()
