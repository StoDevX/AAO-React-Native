// @flow
import type {
  NavigationRoute,
  NavigationScreenProp,
  NavigationAction,
} from 'react-navigation'

export type TopLevelViewPropsType = {
  navigation: NavigationScreenProp<NavigationRoute, NavigationAction>,
}
