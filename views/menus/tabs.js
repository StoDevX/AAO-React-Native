// @flow

import CageMenuView from './menus/cage'
import StavMenuView from './menus/stav'
import PauseMenuView from './menus/pause'

export default [
  {
    id: 'stav',
    title: 'Stav Hall',
    rnVectorIcon: {iconName: 'nutrition'},
    component: StavMenuView,
  },
  {
    id: 'cage',
    title: 'The Cage',
    rnVectorIcon: {iconName: 'cafe'},
    component: CageMenuView,
  },
  {
    id: 'pause',
    title: 'The Pause',
    rnVectorIcon: {iconName: 'paw'},
    component: PauseMenuView,
  },
]
