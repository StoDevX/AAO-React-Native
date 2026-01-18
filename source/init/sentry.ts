import {SENTRY_DSN} from './constants'
import * as Sentry from '@sentry/react-native'
import {IS_PRODUCTION} from '@frogpond/constants'

export {wrap} from '@sentry/react-native'

// Construct a new instrumentation instance. This is needed to communicate between the integration and React
export const routingInstrumentation = Sentry.reactNavigationIntegration({
	enableTimeToInitialDisplay: true,
	useDispatchedActionData: true,
})

export function init() {
	Sentry.init({
		enabled: IS_PRODUCTION,

		dsn: SENTRY_DSN,

		// Adds more context data to events (IP address, cookies, user, etc.)
		// For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
		sendDefaultPii: true,

		// Enable Logs
		enableLogs: true,

		tracesSampleRate: 0.2,

		// Configure Session Replay
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1,
		integrations: [
			Sentry.mobileReplayIntegration(),
			Sentry.feedbackIntegration(),
			Sentry.reactNativeTracingIntegration(),
			routingInstrumentation,
		],

		// uncomment the line below to enable Spotlight (https://spotlightjs.com)
		spotlight: __DEV__,
	})
}

