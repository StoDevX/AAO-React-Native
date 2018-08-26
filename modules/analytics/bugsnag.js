// @flow
import {Client, Configuration} from 'bugsnag-react-native'
import {IS_PRODUCTION} from '@frogpond/constants'

let client: Client

export function initBugsnag() {
	const config = new Configuration()
	config.autoNotify = IS_PRODUCTION
	if (!IS_PRODUCTION) {
		// disable bugsnag in dev builds
		config.beforeSendCallbacks.push(() => false)
	}

	client = new Client(config)
}

export const notify = (err: Error) => client.notify(err)
export const leaveBreadcrumb: typeof client.leaveBreadcrumb = (...args) =>
	client.leaveBreadcrumb(...args)
