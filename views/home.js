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

const views = [
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
]

function HomePageButton({view, navigator}) {
  return (
    <TouchableOpacity
      key={view.title}
      onPress={() => navigator.push({id: view.view, title: view.title, sceneConfig: Navigator.SceneConfigs.FloatFromRight})}
      activeOpacity={0.5}
    >
      <View style={[styles.rectangle, styles[`${view.view}Button`]]}>
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
  view: React.PropTypes.shapeOf({
    view: React.PropTypes.string.isRequired,
    title: React.PropTypes.string.isRequired,
    icon: React.PropTypes.string.isRequired,
    usable: React.PropTypes.bool.isRequired,
  }).isRequired,
}



function HomePageScene({navigator}) {
  return (
    <ScrollView
      automaticallyAdjustContentInsets={false}
      scrollEventThrottle={200}
      overflow={'hidden'}
      alwaysBounceHorizontal={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      <View style={styles.container}>
        {views.map(view =>
          <HomePageButton view={view} navigator={navigator} />)}
      </View>
    </ScrollView>
  )
}

HomePageScene.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator),
}



export default function HomePage({navigator}) {
  return <NavigatorScreen
    {...this.props}
    title='All About Olaf'
    renderScene={HomePageScene.bind(null, navigator)}
    leftButton={(route, navigator) =>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigator.push({id: 'SettingsView', title: 'Settings', sceneConfig: Navigator.SceneConfigs.FloatFromLeft})}
      >
        <Icon name='info' style={styles.navigationButtonIcon} />
      </TouchableOpacity>
    }
    rightButton={(route, navigator) =>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigator.parentNavigator.pop()}
      >
        <Text style={styles.navigationButtonText}>Edit</Text>
      </TouchableOpacity>
    }
  />
}

HomePage.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator),
}


import * as c from './components/colors'

const Dimensions = require('Dimensions')
let Viewport = Dimensions.get('window')

let marginTop = 15

let cellMargin = 10
let cellSidePadding = 10
let cellEdgePadding = 10
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

  MenusViewButton: {
    backgroundColor: c.emerald,
  },
  SISViewButton: {
    backgroundColor: c.goldenrod,
  },
  BuildingHoursViewButton: {
    backgroundColor: c.wave,
  },
  CalendarViewButton: {
    backgroundColor: c.coolPurple,
  },
  DirectoryViewButton: {
    backgroundColor: c.indianRed,
  },
  StreamingViewButton: {
    backgroundColor: c.denim,
  },
  NewsViewButton: {
    backgroundColor: c.eggplant,
  },
  MapViewButton: {
    backgroundColor: c.coffee,
  },
  ContactsViewButton: {
    backgroundColor: c.crimson,
  },
  TransportationViewButton: {
    backgroundColor: c.cardTable,
  },
  DictionaryViewButton: {
    backgroundColor: c.olive,
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
