import {SENTRY_DSN} from './constants'
import * as Sentry from '@sentry/react-native'
import {IS_PRODUCTION} from '@frogpond/constants'

export * from '@sentry/react-native'

export const navigationIntegration = Sentry.reactNavigationIntegration({
	enableTimeToInitialDisplay: true,
})

function install() {
	if (!IS_PRODUCTION) {
		return
	}

	Sentry.init({
		dsn: SENTRY_DSN,

		tracesSampleRate: 0.2,
		enableUserInteractionTracing: true,

		integrations: [
			navigationIntegration,
			Sentry.reactNativeTracingIntegration(),
		],
	})
}

install()
