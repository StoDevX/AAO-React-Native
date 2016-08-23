// @flow
// import Icon from 'react-native-vector-icons/Entypo'

import CageMenuView from './cage'
import StavMenuView from './stav'
// import PauseMenuView from './pause'

export default [
  {
    id: 'stav',
    title: 'Stav Hall',
    rnVectorIcon: {
      iconName: 'nutrition',
      selectedIconName: 'text-document-inverted',
    },
    content: StavMenuView,
  },
  {
    id: 'cage',
    title: 'The Cage',
    rnVectorIcon: {iconName: 'cafe'},
    content: CageMenuView,
  },
  // {
  //   id: 'pause',
  //   title: 'The Pause',
  //   icon: {uri: base64Icon, scale: 3},
  //   content: PauseMenuView,
  // },
]
