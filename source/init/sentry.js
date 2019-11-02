// @flow

import {SENTRY_DSN} from './constants'
import * as Sentry from '@sentry/react-native'
import {IS_PRODUCTION} from '@frogpond/constants'

Sentry.init({
	dsn: SENTRY_DSN,
	debug: !IS_PRODUCTION,
})
