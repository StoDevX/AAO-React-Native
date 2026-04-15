import {SENTRY_DSN} from './constants'
import * as Sentry from '@sentry/react-native'
import {IS_PRODUCTION} from '@frogpond/constants'

// Construct a new navigation integration instance. This is needed to communicate between the integration and React
export const navigationIntegration = Sentry.reactNavigationIntegration()

function install() {
	if (!IS_PRODUCTION) {
		return
	}

	Sentry.init({
		dsn: SENTRY_DSN,

		tracesSampleRate: 0.2,

		tracePropagationTargets: ['localhost', 'frogpond.tech', /^\//u],

		// Session replay is opt-in per-error only; no blanket session recording.
		replaysSessionSampleRate: 0,
		replaysOnErrorSampleRate: 0.1,

		integrations: [
			navigationIntegration,
			// All masking options default to `true` — text, images, and vector
			// graphics are blurred in recordings. We pass the defaults
			// explicitly so this choice is visible at the call site.
			Sentry.mobileReplayIntegration({
				maskAllText: true,
				maskAllImages: true,
				maskAllVectors: true,
			}),
		],
	})
}

install()
