/**
 * All About Olaf
 * iOS Home page
 */
'use strict'

// React native
const React = require('react')
const RN = require('react-native')
const NavigatorScreen = require('./components/navigator-screen')

// Namespacing
const {
  Navigator,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} = RN

const Icon = require('react-native-vector-icons/Entypo')


class HomePage extends React.Component {
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
              onPress={() => view.usable && this.pushView(view.view, view.title)}
              activeOpacity={view.usable ? 0.5 : 1}
            >
              <View style={[styles.rectangle, styles['rectangle'+(i+1)]].concat(!view.usable ? [styles.disabledReactangle] : [])}>
                <Icon name={view.icon} size={32} style={styles.rectangleButtonIcon} />
                <Text
                  style={styles.rectangleButtonText}
                  autoAdjustsFontSize={true}
                >
                  {view.title}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    )
  }
}


let NAVY = '#001f3f'
let BLUE = '#0074D9'
// let AQUA = '#7FDBFF'
let TEAL = '#39CCCC'
let OLIVE = '#3D9970'
let GREEN = '#2ECC40'
// let LIME = '#01FF70'
let YELLOW = '#FFDC00'
let ORANGE = '#FF851B'
let RED = '#FF4136'
let MAROON = '#85144b'
// let FUCHSIA = '#F012BE'
let PURPLE = '#B10DC9'
let BLACK = '#111111'
let GRAY = '#AAAAAA'
let SILVER = '#DDDDDD'
let WHITE = '#FFFFFF'

// Device info
const Dimensions = require('Dimensions')
// Screen size information
let Viewport = Dimensions.get('window')
let marginTop = 15
let paddingBottom = 15

let cellSpacing = 10
let cellHeight = Viewport.height / 7
let cellWidth = Viewport.width / 2.3
let leftSideMargin = Viewport.width - (cellWidth * 2) - (cellSpacing * 3)

var styles = StyleSheet.create({
  // Body container
  container: {
    flex: 1,
    paddingLeft: leftSideMargin,
    paddingBottom: paddingBottom,
    marginTop: marginTop,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Main buttons for actions on home screen
  rectangle: {
    width: cellWidth,
    height: cellHeight,
    marginRight: cellSpacing,
    marginTop: cellSpacing,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30 / PixelRatio.get(),
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

  disabledReactangle: {
    backgroundColor: SILVER,
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

module.exports = HomePage
