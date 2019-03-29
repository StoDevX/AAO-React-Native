// @flow

import {AppRegistry, YellowBox} from 'react-native'
import App from './app'

YellowBox.ignoreWarnings([
	'Failed prop type: Invalid prop `containerTagName` of type `object` supplied to `ReactMarkdown`, expected `function`',
])

AppRegistry.registerComponent('AllAboutOlaf', () => App)
