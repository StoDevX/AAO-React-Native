// @flow
import {Navigator} from 'react-native'

export type RouteType = {
  index: number,
  id: string,
  title: string,
  backButtonTitle?: string,
  rightButton?: () => ReactClass<*> | 'share',
  onRightButton?: () => any,
  onDismiss?: (r: RouteType, n: Navigator) => any,
  sceneConfig?: Object | 'fromBottom' | string,
  props?: any,
}

export type NavStateType = {
  routeStack: RouteType[],
}

export type TopLevelViewPropsType = {
  navigator: Navigator,
  route: RouteType,
}
