import {Platform, StyleSheet} from 'react-native'
import {createAppContainer} from 'react-navigation'
import {createStackNavigator} from 'react-navigation-stack'
import * as c from '@frogpond/colors'
import {getTheme} from '@frogpond/app-theme'
import {routes} from './routes'

const theme = getTheme()

const styles = StyleSheet.create({
	header: {
		backgroundColor: theme.navigationBackground,
	},
	card: {
		backgroundColor: c.sectionBgColor,
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
