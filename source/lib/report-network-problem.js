// @flow

import {tracker} from './analytics'
import bugsnag from '../init/bugsnag'

export function reportNetworkProblem(err: Error) {
	tracker.trackException(err.message)
	bugsnag.notify(err)
	console.warn(err)
}
