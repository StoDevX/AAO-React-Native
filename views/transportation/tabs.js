// @flow

import OtherModesView from './otherModes'
import BusView from './bus'

export default [
  {
    id: 'bus',
    title: 'Bus',
    rnVectorIcon: {iconName: 'address'},
    content: BusView,
  },
  {
    id: 'otherModes',
    title: 'Other Modes',
    rnVectorIcon: {iconName: 'map'},
    content: OtherModesView,
  },
]
