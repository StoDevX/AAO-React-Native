// @flow

import {AppRegistry} from 'react-native'
import App from './app'
import codePush from 'react-native-code-push'

// I'm not importing the exported variable because I just want to initialize
// the file here.
import './bugsnag'

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  installMode: codePush.InstallMode.ON_NEXT_RESUME,
}

AppRegistry.registerComponent('AllAboutOlaf', () =>
  codePush(codePushOptions)(App),
)
