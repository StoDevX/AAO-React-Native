// @flow

import {AppRegistry} from 'react-native'
import RootApp from './root'

// I'm not importing the exported variable because I just want to initialize
// the file here.
import '../init/bugsnag'

AppRegistry.registerComponent('AllAboutOlaf', () => RootApp)
