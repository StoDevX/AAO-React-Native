/**
 * All About Olaf
 * iOS Home page
 */
'use strict'

// React native
const React = require('react')
const RN = require('react-native')

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

// Device info
const Dimensions = require('Dimensions')
// Screen size information
let Viewport = Dimensions.get('window')
let height = Viewport.height / 7
let margin = Viewport.width / 13
let marginTop = 70
let width = Viewport.width / 2.3


class HomePage extends React.Component {
  render() {
    return (
      <Navigator
        renderScene={this.renderScene.bind(this)}
        navigator={this.props.navigator}
        navigationBar={
          <Navigator.NavigationBar
            style={styles.navigationBar}
            routeMapper={NavigationBarRouteMapper}
          />
        }
      />
    )
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
      {view: 'MenusView', title: 'Menus'},
      {view: 'SISView', title: 'SIS'},
      {view: 'SchedulesView', title: 'Schedules'},
      {view: 'CalendarView', title: 'Calendar'},
      {view: 'DirectoryView', title: 'Directory'},
      {view: 'StreamingView', title: 'Streaming Media'},
      {view: 'NewsView', title: 'News'},
      {view: 'MapView', title: 'Campus Map'},
      {view: 'ContactsView', title: 'Important Contacts'},
      {view: 'TransportationView', title: 'Transportation'},
      {view: 'DictionaryView', title: 'Campus Dictionary'},
      // {view: '', title: ''},
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
              key={view.view}
              onPress={() => this.pushView(view.view, view.title)}
              activeOpacity={0.5}
            >
              <View style={[styles.rectangle, styles['rectangle'+(i+1)]]}>
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


/******************************************
 * Routing
 *****************************************/

var NavigationBarRouteMapper = {
  // Left button customization
  LeftButton(route, navigator) {
    return (
      <TouchableOpacity style={styles.navButton}
        onPress={() => navigator.parentNavigator.pop()}
      >
        <Text style={styles.navigationButtonText}>
          Info
        </Text>
      </TouchableOpacity>
    )
  },
  // Right button customization
  RightButton() {
    return null
  },
  // Title customization
  Title() {
    return (
      <Text style={styles.navigationText}>
        All About Olaf
      </Text>
    )
  }
}


/******************************************
 * Styles
 *****************************************/

var styles = StyleSheet.create({
  // Body container
  container: {
    flex: 1,
    paddingLeft: 17,
    paddingBottom: 15,
    marginLeft: margin - 25,
    marginTop: marginTop,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Main buttons for actions on home screen
  rectangle: {
    width: width,
    height: height,
    marginRight: 10,
    marginTop: 10,
    alignItems: 'center',
    // alignContent: 'center',
    justifyContent: 'center',
    borderRadius: 30 / PixelRatio.get(),
  },
  rectangle1: {
    backgroundColor: '#FCB915',
  },
  rectangle2: {
    backgroundColor: '#F94E26',
  },
  rectangle3: {
    backgroundColor: '#7E71FF',
  },
  rectangle4: {
    backgroundColor: '#E52983',
  },
  rectangle5: {
    backgroundColor: '#999999',
  },
  rectangle6: {
    backgroundColor: '#20B407',
  },
  rectangle7: {
    backgroundColor: '#FB863A',
  },
  rectangle8: {
    backgroundColor: '#1C85F6',
  },
  rectangle9: {
    backgroundColor: '#2C57D6',
  },
  rectangle10: {
    backgroundColor: '#CD23CE',
  },
  rectangle11: {
    backgroundColor: '#49D3DA',
  },
  rectangle12: {
    backgroundColor: '#F1EEA1',
  },

  // Navigation bar styling
  navigationBar: {
    backgroundColor: 'orange',
    marginBottom: 100,
  },
  navigationButton: {
    flex: 1,
    justifyContent: 'center',
  },
  navigationButtonText: {
    color: 'white',
    margin: 10,
  },
  navigationText: {
    color: 'white',
    fontWeight: '500',
    margin: 10,
    fontSize: 16,
  },

  // Text styling in buttons
  rectangleButtonText: {
    color:'#fff',
    textAlign:'center',
    fontSize: 14,
    paddingLeft: 20,
    paddingRight: 20,
  },
})

module.exports = HomePage
