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
          {views.map((view, i) =>
            <TouchableOpacity
              key={view.title}
              onPress={() => this.pushView(view.view, view.title)}
              activeOpacity={0.5}
            >
              <View style={[styles.rectangle, styles['rectangle'+(i+1)]]}>
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

// Device info
const Dimensions = require('Dimensions')
// Screen size information
let Viewport = Dimensions.get('window')
let marginTop = 10
let paddingBottom = marginTop

let cellSpacing = marginTop / 2
let cellWidth = (Viewport.width / 2) - (cellSpacing * 4)
let cellTopPadding = 10
let sideMargin = cellSpacing / 2

var styles = StyleSheet.create({
  // Body container
  container: {
    flex: 1,
    paddingLeft: sideMargin,
    paddingRight: sideMargin,
    paddingBottom: paddingBottom,
    marginTop: marginTop,
    justifyContent: 'space-around',
    // alignItems: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Main buttons for actions on home screen
  rectangle: {
    // flex: 1,
    width: cellWidth,
    marginRight: cellSpacing,
    marginBottom: cellSpacing,
    marginLeft: cellSpacing,
    marginTop: cellSpacing,
    alignItems: 'center',
    // justifyContent: 'center',
    paddingTop: cellTopPadding,
    paddingBottom: cellTopPadding,
    borderRadius: 10,
  },

  rectangle1: {
    backgroundColor: c.emerald,
  },
  rectangle2: {
    backgroundColor: c.goldenrod,
  },
  rectangle3: {
    backgroundColor: c.wave,
  },
  rectangle4: {
    backgroundColor: c.coolPurple,
  },
  rectangle5: {
    backgroundColor: c.indianRed,
  },
  rectangle6: {
    backgroundColor: c.denim,
  },
  rectangle7: {
    backgroundColor: c.eggplant,
  },
  rectangle8: {
    backgroundColor: c.coffee,
  },
  rectangle9: {
    backgroundColor: c.crimson,
  },
  rectangle10: {
    backgroundColor: c.cardTable,
  },
  rectangle11: {
    backgroundColor: c.olive,
  },

  navigationButtonText: {
    color: c.mandarin,
    // marginTop: 8,
    // marginLeft: 14,
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
    paddingLeft: 10,
    paddingRight: 10,
  },
})
