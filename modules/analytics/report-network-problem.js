// @flow

import {notify} from './bugsnag'

export function reportNetworkProblem(err: Error) {
	notify(err)
	console.warn(err)
}
