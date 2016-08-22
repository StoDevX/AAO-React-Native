// @flow
// import Icon from 'react-native-vector-icons/Entypo'

import OtherModesView from './otherModes'
import BusView from './bus'
// import PauseMenuView from './pause'

export default [
  {
    id: 'bus',
    title: 'Bus',
    rnVectorIcon: {
      iconName: 'bus',
      selectedIconName: 'bus',
    },
    content: BusView,
  },
  {
    id: 'otherModes',
    title: 'Other Modes',
    rnVectorIcon: {iconName: 'cab'},
    content: OtherModesView,
  },
  // {
  //   id: 'pause',
  //   title: 'The Pause',
  //   icon: {uri: base64Icon, scale: 3},
  //   content: PauseMenuView,
  // },
]
