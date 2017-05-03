// @flow
import {Client} from 'bugsnag-react-native'
import noop from 'lodash/noop'

// We will need to add any other methods we eventually use in Bugsnag to this
// faux-bugsnag object, I believe.
let client = {notify: noop}
if (process.env.NODE_ENV === 'production') {
  client = new Client()
}

export default client
