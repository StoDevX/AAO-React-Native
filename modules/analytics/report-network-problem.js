// @flow

import {Sentry} from 'react-native-sentry'

export function reportNetworkProblem(err: Error) {
	Sentry.captureException(err)
	console.warn(err)
}
