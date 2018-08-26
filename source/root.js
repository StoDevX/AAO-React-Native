// @flow

import {AppRegistry, YellowBox} from 'react-native'
import App from './app'

YellowBox.ignoreWarnings([
	// TODO: remove me after upgrading to RN 0.56
	'Warning: isMounted(...) is deprecated',
	// TODO: remove me after upgrading to RN 0.56
	'Module RCTImageLoader',
])

AppRegistry.registerComponent('AllAboutOlaf', () => App)
