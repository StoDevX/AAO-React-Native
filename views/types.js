// @flow
import {PropTypes} from 'react'
import {Navigator} from 'react-native'

export type RouteType = {
  index: number,
  id: string,
  title: string,
  backButtonTitle?: string,
  onDismiss?: (r: RouteType, n: Navigator) => any,
  sceneConfig?: Object|'fromBottom'|void,
};

export type NavStateType = {
  routeStack: RouteType[],
};

export type TopLevelViewPropsType = {
  navigator: Navigator,
  route: RouteType,
};

export const TopLevelViewPropTypes = {
  navigator: PropTypes.instanceOf(Navigator).isRequired,
  route: PropTypes.object.isRequired,
}
