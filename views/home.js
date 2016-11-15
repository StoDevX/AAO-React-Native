// @flow
/**
 * All About Olaf
 * iOS Home page
 */

import React from 'react'
import {
  Navigator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native'

import Icon from 'react-native-vector-icons/Entypo'
import * as c from './components/colors'

const Dimensions = require('Dimensions')
let Viewport = Dimensions.get('window')

type ViewType = {usable: boolean, view: string, title: string, icon: string, tint: string};
const views: ViewType[] = [
  {usable: true, view: 'MenusView', title: 'Menus', icon: 'bowl', tint: c.emerald},
  {usable: true, view: 'SISView', title: 'SIS', icon: 'fingerprint', tint: c.goldenrod},
  {usable: true, view: 'BuildingHoursView', title: 'Building Hours', icon: 'clock', tint: c.wave},
  {usable: true, view: 'CalendarView', title: 'Calendar', icon: 'calendar', tint: c.coolPurple},
  {usable: true, view: 'DirectoryView', title: 'Directory', icon: 'v-card', tint: c.indianRed},
  {usable: true, view: 'StreamingView', title: 'Streaming Media', icon: 'video', tint: c.denim},
  {usable: true, view: 'NewsView', title: 'News', icon: 'news', tint: c.eggplant},
  {usable: true, view: 'MapView', title: 'Campus Map', icon: 'map', tint: c.coffee},
  {usable: true, view: 'ContactsView', title: 'Important Contacts', icon: 'phone', tint: c.crimson},
  {usable: true, view: 'TransportationView', title: 'Transportation', icon: 'address', tint: c.cardTable},
  {usable: true, view: 'DictionaryView', title: 'Campus Dictionary', icon: 'open-book', tint: c.olive},
  {usable: true, view: 'OlevilleView', title: 'Oleville', icon: 'mouse-pointer', tint: c.grapefruit},
]


type ScenePropsType = {navigator: typeof Navigator, route: Object};
export default function HomePageScene({navigator, route}: ScenePropsType) {
  return (
    <ScrollView
      overflow={'hidden'}
      alwaysBounceHorizontal={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
      //contentContainerStyle={Platform.OS === 'android' ? styles.rows : styles.cells}
      contentContainerStyle={styles.cells}
    >
      <StatusBar
        barStyle='light-content'
        backgroundColor={c.gold}
      />
      {views.map(view =>
        <TouchableOpacity
          key={view.view}
          onPress={() => navigator.push({
            id: view.view,
            index: route.index + 1,
            title: view.title,
            sceneConfig: Navigator.SceneConfigs.PushFromRight,
          })}
          activeOpacity={0.5}
          //style={[Platform.OS === 'ios' ? styles.rectangle : styles.row, Platform.OS === 'ios' ? {backgroundColor: view.tint} : null]}
          style={[styles.rectangle, {backgroundColor: view.tint}]}
        >
          {/*<Icon name={view.icon} size={Platform.OS === 'ios' ? 32 : 28} style={[Platform.OS === 'ios' ? styles.rectangleButtonIcon : styles.listIcon, Platform.OS === 'android' ? {color: view.tint} : null]} />*/}
          <Icon name={view.icon} size={32} style={styles.rectangleButtonIcon} />

          <Text
            style={styles.rectangleButtonText}
            autoAdjustsFontSize={true}
          >
            {view.title}
          </Text>
        </TouchableOpacity>)
      }
    </ScrollView>
  )
}

HomePageScene.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator),
  route: React.PropTypes.object.isRequired,
}


let cellMargin = 10
let cellSidePadding = 10
let cellEdgePadding = 4
let cellWidth = (Viewport.width / 2) - (cellMargin * 1.5)

let styles = StyleSheet.create({
  // Body container
  cells: {
    marginHorizontal: cellMargin / 2,
    marginTop: cellMargin / 2,
    paddingBottom: cellMargin / 2,

    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  rows: {},

  scrollView: {
    // elevation: 2,
  },

  // Main buttons for actions on home screen
  rectangle: {
    width: cellWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: cellSidePadding,
    paddingBottom: cellSidePadding / 2,
    paddingHorizontal: cellEdgePadding,
    borderRadius: Platform.OS === 'ios' ? 6 : 3,
    elevation: 2,

    marginTop: cellMargin / 2,
    marginBottom: cellMargin / 2,
    marginLeft: cellMargin / 2,
    marginRight: cellMargin / 2,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'rgb(224, 224, 224)',
  },

  listIcon: {
    paddingLeft: 15,
    paddingRight: 30,
  },
  listText: {
    fontSize: 16,
  },

  // Text styling in buttons
  rectangleButtonIcon: {
    color: c.white,
  },
  rectangleButtonText: {
    color: c.white,
    marginTop: cellSidePadding / 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
    textAlign: 'center',
    fontSize: 14,
  },
})
