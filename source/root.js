// @flow

import {AppRegistry, YellowBox} from 'react-native'
import App from './app'

YellowBox.ignoreWarnings([
	// TODO: remove me after upgrading to RN 0.56
	'Warning: isMounted(...) is deprecated',
	// TODO: remove me after upgrading to RN 0.56
	'Module RCTImageLoader',
	// TODO: remove me (working with new native iOS tableview renders this once per cell)
	'Module RNCalendarEvents',
])

AppRegistry.registerComponent('AllAboutOlaf', () => App)
