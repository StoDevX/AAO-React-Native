// @flow
import {Client, Configuration} from 'bugsnag-react-native'
import pkg from '../../package.json'

const PRODUCTION = process.env.NODE_ENV === 'production'

const config = new Configuration()
config.autoNotify = PRODUCTION
config.codeBundleId = pkg.version
if (!PRODUCTION) {
  // disable bugsnag in dev builds
  config.beforeSendCallbacks.push(() => false)
}

const client = new Client(config)

export default client
