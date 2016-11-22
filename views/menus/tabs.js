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
    props: {menuUrl: 'http://legacy.cafebonappetit.com/api/2/menus?cafe=261'},
  },
  {
    id: 'cage',
    title: 'The Cage',
    rnVectorIcon: {iconName: 'cafe'},
    component: CageMenuView,
    props: {menuUrl: 'http://legacy.cafebonappetit.com/api/2/menus?cafe=262'},
  },
  {
    id: 'sayles',
    title: 'Sayles Hill',
    rnVectorIcon: {iconName: 'cafe'},
    component: CageMenuView,
    props: {menuUrl: 'http://legacy.cafebonappetit.com/api/2/menus?cafe=34'},
  },
  {
    id: 'burton',
    title: 'Burton',
    rnVectorIcon: {iconName: 'nutrition'},
    component: StavMenuView,
    props: {menuUrl: 'http://legacy.cafebonappetit.com/api/2/menus?cafe=35'},
  },
  {
    id: 'ldc',
    title: 'LDC',
    rnVectorIcon: {iconName: 'nutrition'},
    component: StavMenuView,
    props: {menuUrl: 'http://legacy.cafebonappetit.com/api/2/menus?cafe=36'},
  },
  {
    id: 'weitz',
    title: 'Weitz Center',
    rnVectorIcon: {iconName: 'cafe'},
    component: CageMenuView,
    props: {menuUrl: 'http://legacy.cafebonappetit.com/api/2/menus?cafe=458'},
  },
  {
    id: 'pause',
    title: 'The Pause',
    rnVectorIcon: {iconName: 'paw'},
    component: PauseMenuView,
  },
]
