// @flow

import {Platform, StyleSheet} from 'react-native'
import {createStackNavigator} from 'react-navigation'
import * as c from '../components/colors'
import {routes} from './routes'

const styles = StyleSheet.create({
	header: {
		backgroundColor: c.navigationBackground,
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
		headerTintColor: c.navigationForeground,
	},
	headerTransitionPreset: Platform.select({
		ios: 'uikit',
		android: undefined,
	}),
	cardStyle: styles.card,
}

export const AppNavigator = createStackNavigator(routes, navigatorOptions)
