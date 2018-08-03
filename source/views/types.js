// @flow
import type {ViewStyleProp, TextStyleProp, ImageStyleProp} from 'StyleSheet'

import type {
	NavigationRoute,
	NavigationScreenProp,
	NavigationAction,
} from 'react-navigation'

export type NavType = NavigationScreenProp<NavigationRoute, NavigationAction>

export type TopLevelViewPropsType = {
	navigation: NavType,
}

export type {ViewStyleProp, TextStyleProp, ImageStyleProp}
