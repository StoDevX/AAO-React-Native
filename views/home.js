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
  View,
} from 'react-native'

import NavigatorScreen from './components/navigator-screen'
import Icon from 'react-native-vector-icons/Entypo'
import * as c from './components/colors'

const Dimensions = require('Dimensions')
let Viewport = Dimensions.get('window')

type ViewType = {usable: boolean, view: string, title: string, icon: string};
const views: ViewType[] = [
  {usable: true, view: 'MenusView', title: 'Menus', icon: 'bowl'},
  {usable: false, view: 'SISView', title: 'SIS', icon: 'fingerprint'},
  {usable: true, view: 'BuildingHoursView', title: 'Building Hours', icon: 'clock'},
  {usable: true, view: 'CalendarView', title: 'Calendar', icon: 'calendar'},
  {usable: true, view: 'DirectoryView', title: 'Directory', icon: 'v-card'},
  {usable: true, view: 'StreamingView', title: 'Streaming Media', icon: 'video'},
  {usable: true, view: 'NewsView', title: 'News', icon: 'news'},
  {usable: true, view: 'MapView', title: 'Campus Map', icon: 'map'},
  {usable: true, view: 'ContactsView', title: 'Important Contacts', icon: 'phone'},
  {usable: false, view: 'TransportationView', title: 'Transportation', icon: 'address'},
  {usable: true, view: 'DictionaryView', title: 'Campus Dictionary', icon: 'open-book'},
  {usable: true, view: 'OlevilleView', title: 'Oleville', icon: 'mouse-pointer'},
]

const buttonStyles = (StyleSheet.create({
  MenusView: { backgroundColor: c.emerald },
  SISView: { backgroundColor: c.goldenrod },
  BuildingHoursView: { backgroundColor: c.wave },
  CalendarView: { backgroundColor: c.coolPurple },
  DirectoryView: { backgroundColor: c.indianRed },
  StreamingView: { backgroundColor: c.denim },
  NewsView: { backgroundColor: c.eggplant },
  MapView: { backgroundColor: c.coffee },
  ContactsView: { backgroundColor: c.crimson },
  TransportationView: { backgroundColor: c.cardTable },
  DictionaryView: { backgroundColor: c.olive },
  OlevilleView: { backgroundColor: c.grapefruit },
}): Object)  // force flow to let us access the styles with the string keys

type ButtonPropsType = {view: ViewType, navigator: typeof Navigator};
function HomePageButton({view, navigator}: ButtonPropsType) {
  return (
    <TouchableOpacity
      onPress={() => navigator.push({id: view.view, index: 1, title: view.title, sceneConfig: Navigator.SceneConfigs.PushFromRight})}
      activeOpacity={0.5}
    >
      <View style={[styles.rectangle, buttonStyles[view.view]]}>
        <Icon name={view.icon} size={32} style={styles.rectangleButtonIcon} />
        <Text
          style={styles.rectangleButtonText}
          autoAdjustsFontSize={true}
        >
          {view.title}{view.usable ? '' : ' !'}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

HomePageButton.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator).isRequired,
  view: React.PropTypes.shape({
    view: React.PropTypes.string.isRequired,
    title: React.PropTypes.string.isRequired,
    icon: React.PropTypes.string.isRequired,
    usable: React.PropTypes.bool.isRequired,
  }).isRequired,
}


type ScenePropsType = {navigator: typeof Navigator};
function HomePageScene({navigator}: ScenePropsType) {
  return (
    <ScrollView
      automaticallyAdjustContentInsets={false}
      scrollEventThrottle={200}
      overflow={'hidden'}
      alwaysBounceHorizontal={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.container}
    >
      {views.map(view =>
        <HomePageButton key={view.title} view={view} navigator={navigator} />)}
    </ScrollView>
  )
}

HomePageScene.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator),
}


export default function HomePage(props: ScenePropsType) {
  let hostNav = props.navigator
  return <NavigatorScreen
    navigator={hostNav}
    title='All About Olaf'
    renderScene={() => <HomePageScene navigator={hostNav} />}
    leftButton={(route, navigator) => {
      return <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigator.push({id: 'SettingsView', title: 'Settings', sceneConfig: Navigator.SceneConfigs.FloatFromBottom})}
      >
        <Icon name='cog' style={styles.navigationButtonIcon} />
      </TouchableOpacity>
    }}
    rightButton={() =>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => {}}
      >
        <Text style={styles.navigationButtonText}>Edit</Text>
      </TouchableOpacity>
    }
  />
}

HomePage.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator),
}


let marginTop = 15

let cellMargin = 10
let cellSidePadding = 10
let cellEdgePadding = 8
let cellWidth = (Viewport.width / 2) - (cellMargin * 1.5)

let styles = StyleSheet.create({
  // Body container
  container: {
    marginLeft: cellMargin,
    marginTop: marginTop,

    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  scrollView: {},
  navButton: {},

  // Main buttons for actions on home screen
  rectangle: {
    width: cellWidth,
    alignItems: 'center',
    paddingTop: cellSidePadding,
    paddingBottom: cellSidePadding,
    paddingRight: cellEdgePadding,
    paddingLeft: cellEdgePadding,
    borderRadius: 6,

    marginBottom: cellMargin,
    marginRight: cellMargin,
  },

  navigationButtonText: {
    color: c.mandarin,
  },
  navigationButtonIcon: {
    color: c.mandarin,
    fontSize: 20,
    marginTop: 8,
    marginLeft: 14,
  },

  // Text styling in buttons
  rectangleButtonIcon: {
    color: c.white,
  },
  rectangleButtonText: {
    color: c.white,
    textAlign: 'center',
    fontSize: 14,
  },
})
