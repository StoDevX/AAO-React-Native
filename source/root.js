// @flow

import {AppRegistry, YellowBox} from 'react-native'
import App from './app'

YellowBox.ignoreWarnings(['Invalid prop `containerTagName`'])

AppRegistry.registerComponent('AllAboutOlaf', () => App)
