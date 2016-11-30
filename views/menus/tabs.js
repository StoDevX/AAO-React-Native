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
    props: {cafeId: '261', loadingMessage: 'Hunting Ferndale Turkey…'},
  },
  {
    id: 'cage',
    title: 'The Cage',
    rnVectorIcon: {iconName: 'cafe'},
    component: CageMenuView,
    props: {cafeId: '262', loadingMessage: 'Checking for vegan cookies…'},
  },
  {
    id: 'sayles',
    title: 'Sayles Hill',
    rnVectorIcon: {iconName: 'cafe'},
    component: CageMenuView,
    props: {cafeId: '34', loadingMessage: 'temp1'},
  },
  {
    id: 'burton',
    title: 'Burton',
    rnVectorIcon: {iconName: 'nutrition'},
    component: StavMenuView,
    props: {cafeId: '35', loadingMessage: 'Searching for Schiller…'},
  },
  {
    id: 'ldc',
    title: 'LDC',
    rnVectorIcon: {iconName: 'nutrition'},
    component: StavMenuView,
    props: {cafeId: '36', loadingMessage: 'temp2'},
  },
  {
    id: 'weitz',
    title: 'Weitz Center',
    rnVectorIcon: {iconName: 'cafe'},
    component: CageMenuView,
    props: {cafeId: '458', loadingMessage: 'temp3'},
  },
  {
    id: 'pause',
    title: 'The Pause',
    rnVectorIcon: {iconName: 'paw'},
    component: PauseMenuView,
  },
]
