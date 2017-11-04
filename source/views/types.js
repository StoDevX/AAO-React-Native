// @flow
import type {
  NavigationRoute,
  NavigationScreenProp,
  NavigationAction,
} from 'react-navigation/src/TypeDefinition'

export type NavType = NavigationScreenProp<NavigationRoute, NavigationAction>

export type TopLevelViewPropsType = {
  navigation: NavType,
}
