/**
 * All About Olaf
 * iOS Home page
 */
'use strict'

// React native
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
            <Icon name='info' style={styles.navigationButtonText} />
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
    let views = [
      {usable: true, view: 'MenusView', title: 'Menus', icon: 'bowl'},
      {usable: true, view: 'SISView', title: 'SIS', icon: 'fingerprint'},
      {usable: false, view: 'BuildingHoursView', title: 'Building Hours', icon: 'clock'},
      {usable: false, view: 'CalendarView', title: 'Calendar', icon: 'calendar'},
      {usable: false, view: 'DirectoryView', title: 'Directory', icon: 'v-card'},
      {usable: false, view: 'StreamingView', title: 'Streaming Media', icon: 'video'},
      {usable: false, view: 'NewsView', title: 'News', icon: 'news'},
      {usable: false, view: 'MapView', title: 'Campus Map', icon: 'map'},
      {usable: false, view: 'ContactsView', title: 'Important Contacts', icon: 'phone'},
      {usable: false, view: 'TransportationView', title: 'Transportation', icon: 'address'},
      {usable: false, view: 'DictionaryView', title: 'Campus Dictionary', icon: 'open-book'},
    ]

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
              <View style={[styles.rectangle, styles['rectangle'+(i+1)]].concat(!view.usable ? [styles.disabledReactangle] : [])}>
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


// let AQUA = '#7FDBFF'
let BLACK = '#111111'
let BLUE = '#0074D9'
// let FUCHSIA = '#F012BE'
let GRAY = '#AAAAAA'
let GREEN = '#2ECC40'
// let LIME = '#01FF70'
let MAROON = '#85144b'
let NAVY = '#001f3f'
let OLIVE = '#3D9970'
let ORANGE = '#FF851B'
let PURPLE = '#B10DC9'
let RED = '#FF4136'
// let SILVER = '#DDDDDD'
let TEAL = '#39CCCC'
let WHITE = '#FFFFFF'
let YELLOW = '#FFDC00'

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
    backgroundColor: YELLOW,
  },
  rectangle2: {
    backgroundColor: RED,
  },
  rectangle3: {
    backgroundColor: PURPLE,
  },
  rectangle4: {
    backgroundColor: OLIVE,
  },
  rectangle5: {
    backgroundColor: GRAY,
  },
  rectangle6: {
    backgroundColor: GREEN,
  },
  rectangle7: {
    backgroundColor: ORANGE,
  },
  rectangle8: {
    backgroundColor: BLUE,
  },
  rectangle9: {
    backgroundColor: TEAL,
  },
  rectangle10: {
    backgroundColor: MAROON,
  },
  rectangle11: {
    backgroundColor: NAVY,
  },
  rectangle12: {
    backgroundColor: BLACK,
  },

  rectangleButtonIcon: {
    color: WHITE,
  },

  navigationButtonText: {
    color: WHITE,
    fontSize: 20,
    marginTop: 8,
    marginLeft: 14,
  },

  // Text styling in buttons
  rectangleButtonText: {
    color: WHITE,
    textAlign: 'center',
    fontSize: 14,
    paddingLeft: 10,
    paddingRight: 10,
  },
})
