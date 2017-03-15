// @flow
import {Navigator} from 'react-native'

export type RouteType = {
  index: number,
  id: string,
  title: string,
  backButtonTitle?: string,
  rightButton?: () => ReactClass<*>,
  onDismiss?: (r: RouteType, n: Navigator) => any,
  sceneConfig?: Object | 'fromBottom' | string,
};

export type NavStateType = {
  routeStack: RouteType[],
};

export type TopLevelViewPropsType = {
  navigator: Navigator,
  route: RouteType,
};
