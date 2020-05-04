// @flow

import {SENTRY_DSN} from './constants'
import * as Sentry from '@sentry/react-native'
import {IS_PRODUCTION} from '@frogpond/constants'

function install() {
	if (!IS_PRODUCTION) {
		return
	}

	Sentry.init({dsn: SENTRY_DSN})
}

install()
