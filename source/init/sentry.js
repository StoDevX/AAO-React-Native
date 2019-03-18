// @flow

import {SENTRY_DSN} from './constants'
import {Sentry, SentryLog} from 'react-native-sentry'
import {IS_PRODUCTION} from '@frogpond/constants'

export function bootSentry() {
	let config = Sentry.config(SENTRY_DSN, {
		logLevel: SentryLog.Debug,
		handlePromiseRejection: true,
	})

	if (!IS_PRODUCTION) {
		config.install()
	}
}
