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
  {usable: false, view: 'DirectoryView', title: 'Directory', icon: 'v-card'},
  {usable: false, view: 'StreamingView', title: 'Streaming Media', icon: 'video'},
  {usable: false, view: 'NewsView', title: 'News', icon: 'news'},
  {usable: false, view: 'MapView', title: 'Campus Map', icon: 'map'},
  {usable: true, view: 'ContactsView', title: 'Important Contacts', icon: 'phone'},
  {usable: false, view: 'TransportationView', title: 'Transportation', icon: 'address'},
  {usable: true, view: 'DictionaryView', title: 'Campus Dictionary', icon: 'open-book'},
]

export default class HomePage extends React.Component {
  render() {
    return <NavigatorScreen
      {...this.props}
      title="All About Olaf"
      renderScene={this.renderScene.bind(this)}
      leftButton={(route, navigator) => {
        return (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigator.parentNavigator.pop()}
          >
            <Icon name='info' style={styles.navigationButtonIcon} />
          </TouchableOpacity>
        )
      }}
      rightButton={(route, navigator) => {
        return (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigator.parentNavigator.pop()}
          >
            <Text style={styles.navigationButtonText}>Edit</Text>
          </TouchableOpacity>
        )
      }}
    />
  }

  // Go to request page
  pushView(view, viewTitle) {
    this.props.navigator.push({
      id: view,
      title: viewTitle,
      sceneConfig: Navigator.SceneConfigs.FloatFromRight,
    })
  }

  // Render a given scene
  renderScene() {
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
            <TouchableOpacity
              key={view.title}
              onPress={() => this.pushView(view.view, view.title)}
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
          )}
        </View>
      </ScrollView>
    )
  }
}


import * as c from './components/colors'

const Dimensions = require('Dimensions')
let Viewport = Dimensions.get('window')

let marginTop = 15

let cellMargin = 10
let cellSidePadding = 10
let cellEdgePadding = 10
let cellWidth = (Viewport.width / 2) - (cellMargin * 1.5)

var styles = StyleSheet.create({
  // Body container
  container: {
    flex: 1,
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
