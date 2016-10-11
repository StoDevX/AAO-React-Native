// @flow

import CageMenuView from './cage'
import StavMenuView from './stav'
import PauseMenuView from './pause'

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
