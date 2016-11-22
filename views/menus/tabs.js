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
    childProps: {menuUrl: 'http://legacy.cafebonappetit.com/api/2/menus?cafe=261'},
  },
  {
    id: 'cage',
    title: 'The Cage',
    rnVectorIcon: {iconName: 'cafe'},
    component: CageMenuView,
    childProps: {menuUrl: 'http://legacy.cafebonappetit.com/api/2/menus?cafe=262'},
  },
  {
    id: 'pause',
    title: 'The Pause',
    rnVectorIcon: {iconName: 'paw'},
    component: PauseMenuView,
  },
]
