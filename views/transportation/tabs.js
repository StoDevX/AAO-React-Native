// @flow

import OtherModesView from './otherModes'
import BusView from './bus'

export default [
  {
    id: 'express',
    title: 'Express Bus',
    rnVectorIcon: {iconName: 'bus'},
    component: BusView,
    props: {line: 'Express Bus'},
  },
  {
    id: 'red',
    title: 'Red Line',
    rnVectorIcon: {iconName: 'car'},
    component: BusView,
    props: {line: 'Red Line'},
  },
  {
    id: 'blue',
    title: 'Blue Line',
    rnVectorIcon: {iconName: 'train'},
    component: BusView,
    props: {line: 'Blue Line'},
  },
  {
    id: 'otherModes',
    title: 'Other Modes',
    rnVectorIcon: {iconName: 'boat'},
    component: OtherModesView,
  },
]
