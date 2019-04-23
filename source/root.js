// @flow

import {Navigation} from 'react-native-navigation'
import {YellowBox} from 'react-native'
import App from './app'

YellowBox.ignoreWarnings([
	'Failed prop type: Invalid prop `containerTagName` of type `object` supplied to `ReactMarkdown`, expected `function`',
])

Navigation.events().registerAppLaunchedListener(() => {
	Navigation.setRoot({
		root: {
			stack: {
				children: [
					{
						component: {
							name: 'app.home',
						},
					},
				],
			},
		},
	})
})
