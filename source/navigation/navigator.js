// @flow

import {Platform, StyleSheet} from 'react-native'
import {createStackNavigator} from 'react-navigation'
import * as c from '@frogpond/colors'
import {getTheme} from '@frogpond/app-theme'
import {routes} from './routes'

let theme = getTheme()

const styles = StyleSheet.create({
	header: {
		backgroundColor: theme.navigationBackground,
	},
	card: {
		backgroundColor: Platform.select({
			ios: c.iosLightBackground,
			android: c.androidLightBackground,
		}),
	},
})

const navigatorOptions = {
	navigationOptions: {
		headerStyle: styles.header,
		headerTintColor: theme.navigationForeground,
	},
	headerTransitionPreset: Platform.select({
		ios: 'uikit',
		android: undefined,
	}),
	cardStyle: styles.card,
}

export const AppNavigator = createStackNavigator(routes, navigatorOptions)
