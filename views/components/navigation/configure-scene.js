/**
 * @flow
 * A function to handle custom sceneconfigs in routes
 */

import {Navigator} from 'react-native'
import type {RouteType} from '../../types'

export function configureScene(route: RouteType) {
  if (typeof route.sceneConfig === 'object') {
    return route.sceneConfig
  }

  return Navigator.SceneConfigs.PushFromRight
}
