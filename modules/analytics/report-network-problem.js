// @flow

import {trackException} from '@frogpond/analytics'
import {notify} from './bugsnag'

export function reportNetworkProblem(err: Error) {
	trackException(err.message)
	notify(err)
	console.warn(err)
}
