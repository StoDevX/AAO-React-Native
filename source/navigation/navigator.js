// @flow

import {Platform, StyleSheet} from 'react-native'
import {createStackNavigator, createAppContainer} from 'react-navigation'
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
	defaultNavigationOptions: {
		headerStyle: styles.header,
		headerTintColor: theme.navigationForeground,
	},
	headerTransitionPreset: Platform.select({
		ios: 'uikit',
		android: undefined,
	}),
	cardStyle: styles.card,
}

const MainNavigator = createStackNavigator(routes, navigatorOptions)
export const AppNavigator = createAppContainer(MainNavigator)
