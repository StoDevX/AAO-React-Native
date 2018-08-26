// @flow
import {Client, Configuration} from 'bugsnag-react-native'
import {IS_PRODUCTION} from '../lib/constants'

const config = new Configuration()
config.autoNotify = IS_PRODUCTION
if (!IS_PRODUCTION) {
	// disable bugsnag in dev builds
	config.beforeSendCallbacks.push(() => false)
}

const client = new Client(config)

export default client
