// @flow

import OtherModesView from './otherModes'
import BusView from './bus'

export default [
  {
    id: 'express',
    title: 'Express',
    rnVectorIcon: {iconName: 'bus'},
    component: BusView,
    props: {line: 'Express'},
  },
  {
    id: 'red',
    title: 'Red Line',
    rnVectorIcon: {iconName: 'car'},
    component: BusView,
    props: {line: 'Red'},
  },
  {
    id: 'blue',
    title: 'Blue Line',
    rnVectorIcon: {iconName: 'train'},
    component: BusView,
    props: {line: 'Blue'},
  },
  {
    id: 'otherModes',
    title: 'Other Modes',
    rnVectorIcon: {iconName: 'boat'},
    component: OtherModesView,
  },
]
