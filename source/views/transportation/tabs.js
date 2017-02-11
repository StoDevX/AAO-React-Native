// @flow

import OtherModesView from './otherModes'
import BusView from './bus'

export default [
  {
    id: 'ExpressLineBusView',
    title: 'Express Bus',
    rnVectorIcon: {iconName: 'bus'},
    component: BusView,
    props: {line: 'Express Bus'},
  },
  {
    id: 'RedLineBusView',
    title: 'Red Line',
    rnVectorIcon: {iconName: 'bus'},
    component: BusView,
    props: {line: 'Red Line'},
  },
  {
    id: 'BlueLineBusView',
    title: 'Blue Line',
    rnVectorIcon: {iconName: 'bus'},
    component: BusView,
    props: {line: 'Blue Line'},
  },
  {
    id: 'TransportationOtherModesListView',
    title: 'Other Modes',
    rnVectorIcon: {iconName: 'boat'},
    component: OtherModesView,
  },
]
