// @flow
import {Client, Configuration} from 'bugsnag-react-native'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const config = new Configuration()
config.autoNotify = IS_PRODUCTION
if (!IS_PRODUCTION) {
	// disable bugsnag in dev builds
	config.beforeSendCallbacks.push(() => false)
}

const client = new Client(config)

export default client
