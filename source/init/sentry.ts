import {SENTRY_DSN} from './constants'
import * as Sentry from '@sentry/react-native'
import {IS_PRODUCTION} from '@frogpond/constants'

function install() {
	if (!IS_PRODUCTION) {
		return
	}

	Sentry.init({
		dsn: SENTRY_DSN,

		tracesSampleRate: 0.2,

		integrations: [
			new Sentry.ReactNativeTracing({
				tracingOrigins: ['localhost', 'frogpond.tech', /^\//u],
			}),
		],
	})
}

install()
