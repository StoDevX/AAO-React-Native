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

  if (typeof route.sceneConfig === 'string') {
    if (route.sceneConfig in Navigator.SceneConfigs) {
      return Navigator.SceneConfigs[route.sceneConfig]
    }

    if (route.sceneConfig === 'fromBottom') {
      return {
        ...Navigator.SceneConfigs.FloatFromBottom,
        gestures: null,
      }
    }
  }

  return Navigator.SceneConfigs.PushFromRight
}
