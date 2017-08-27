// @flow

import * as c from '../components/colors'
import type {HomescreenViewType, AppNavigationType} from '../app/types'

export const navigation: AppNavigationType = {}

export const view: HomescreenViewType = {
  type: 'url',
  url: 'https://www.myatlascms.com/map/index.php?id=294',
  view: 'MapView',
  title: 'Campus Map',
  icon: 'map',
  tint: c.coffee,
  gradient: c.navyToNavy,
}
