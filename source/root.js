// @flow

import {AppRegistry} from 'react-native'
import App from './app'

// I'm not importing the exported variable because I just want to initialize
// the file here.
import './bugsnag'

AppRegistry.registerComponent('AllAboutOlaf', () => App)
