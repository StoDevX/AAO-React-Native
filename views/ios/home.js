/**
 * All About Olaf
 * iOS Home page
 */
'use strict'

// React native
var React = require('react-native')

// Namespacing
var {
  Component,
  Navigator,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} = React

// Device info
var Dimensions = require('Dimensions')
// Screen size information
let Viewport = Dimensions.get('window')
let height = Viewport.height / 7
let margin = Viewport.width / 13
let marginTop = 70
let width = Viewport.width / 2.3


class HomePage extends Component {
  render() {
    return (
      <Navigator
          renderScene={this.renderScene.bind(this)}
          navigator={this.props.navigator}
          navigationBar={
            <Navigator.NavigationBar style={styles.navigationBar}
                routeMapper={NavigationBarRouteMapper} />
          } />
    )
  }

  // Go to request page
  pushView(theView) {
    this.props.navigator.push({
      id: theView,
      sceneConfig: Navigator.SceneConfigs.FloatFromRight,
    });
  }

  // Render a given scene
  renderScene(route, navigator) {
    return (
        <ScrollView
            automaticallyAdjustContentInsets={false}
            scrollEventThrottle={200}
            overflow={'hidden'}
            alwaysBounceHorizontal={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}>

            <View style={styles.container}>
                <TouchableOpacity onPress={this.pushView.bind(this, "MenusView")} activeOpacity={0.5}>
                    <View style={styles.rectangle1}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Menus
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={this.pushView.bind(this, "SISView")} activeOpacity={0.5}>
                    <View style={styles.rectangle2}>
                        <Text style={styles.rectangleButtonText}
                            autoAdjustsFontSize={true}>
                            SIS
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={this.pushView.bind(this, "SchedulesView")} activeOpacity={0.5}>
                    <View style={styles.rectangle3}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Schedules
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={this.pushView.bind(this, "CalendarView")} activeOpacity={0.5}>
                    <View style={styles.rectangle4}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Calendar
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={this.pushView.bind(this, "DirectoryView")} activeOpacity={0.5}>
                    <View style={styles.rectangle5}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Directory
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={this.pushView.bind(this, "StreamingView")} activeOpacity={0.5}>
                    <View style={styles.rectangle6}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Streaming Media
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={this.pushView.bind(this, "NewsView")} activeOpacity={0.5}>
                    <View style={styles.rectangle7}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            News
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={this.pushView.bind(this, "MapView")} activeOpacity={0.5}>
                    <View style={styles.rectangle8}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Campus Map
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={this.pushView.bind(this, "ContactsView")} activeOpacity={0.5}>
                    <View style={styles.rectangle9}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Important Contacts
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={this.pushView.bind(this, "TransportationView")} activeOpacity={0.5}>
                    <View style={styles.rectangle10}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Transportation
                        </Text>
                    </View>
                </TouchableOpacity>

                 <TouchableOpacity onPress={this.pushView.bind(this, "DictionaryView")} activeOpacity={0.5}>
                   <View style={styles.rectangle11}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Campus Dictionary
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={this.pushView.bind(this, "")} activeOpacity={0.5}>
                    <View style={styles.rectangle12}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                        </Text>
                    </View>
                </TouchableOpacity>
             </View>
          </ScrollView>
    )
  }
}

var NavigationBarRouteMapper = {
  // Left button customization
  LeftButton(route, navigator, index, navState) {
    return (
      <TouchableOpacity style={styles.navButton}
          onPress={() => navigator.parentNavigator.pop()}>
        <Text style={styles.navigationButtonText}>
            Info
        </Text>
      </TouchableOpacity>
    )
  },
  // Right button customization
  RightButton(route, navigator, index, navState) {
    return null
  },
  // Title customization
  Title(route, navigator, index, navState) {
    return (
      <TouchableOpacity style={styles.navButton}>
        <Text style={styles.navigationText}>
          All About Olaf
        </Text>
      </TouchableOpacity>
    )
  }
}

var styles = StyleSheet.create({
  // Body container
  container: {
    flex: 1,
    paddingLeft: 17,
    marginLeft: margin - 25,
    marginTop: marginTop,
    flexDirection:'row',
    flexWrap:'wrap',
  },

  // Main buttons for actions on home screen
  rectangle1: {
    width: width,
    height: height,
    backgroundColor: "#FCB915",
    marginRight: 10,
    marginTop: 10,
    borderRadius: 30 / PixelRatio.get(),
  },
  rectangle2: {
    width: width,
    height: height,
    backgroundColor: "F94E26",
    marginRight: 10,
    marginTop: 10,
    borderRadius: 30 / PixelRatio.get(),
  },
  rectangle3: {
    width: width,
    height: height,
    backgroundColor: "#7E71FF",
    marginRight: 10,
    marginTop: 10,
    borderRadius: 30 / PixelRatio.get(),
  },
  rectangle4: {
    width: width,
    height: height,
    backgroundColor: "#E52983",
    marginRight: 10,
    marginTop: 10,
    borderRadius: 30 / PixelRatio.get(),
  },
  rectangle5: {
    width: width,
    height: height,
    backgroundColor: "#999999",
    marginRight: 10,
    marginTop: 10,
    borderRadius: 30 / PixelRatio.get(),
  },
  rectangle6: {
    width: width,
    height: height,
    backgroundColor: "#20B407",
    marginRight: 10,
    marginTop: 10,
    borderRadius: 30 / PixelRatio.get(),
  },
  rectangle7: {
    width: width,
    height: height,
    backgroundColor: "#FB863A",
    marginRight: 10,
    marginTop: 10,
    borderRadius: 30 / PixelRatio.get(),
  },
  rectangle8: {
    width: width,
    height: height,
    backgroundColor: "#1C85F6",
    marginRight: 10,
    marginTop: 10,
    borderRadius: 30 / PixelRatio.get(),
  },
  rectangle9: {
    width: width,
    height: height,
    backgroundColor: "#2C57D6",
    marginRight: 10,
    marginTop: 10,
    borderRadius: 30 / PixelRatio.get(),
  },
  rectangle10: {
    width: width,
    height: height,
    backgroundColor: "#CD23CE",
    marginRight: 10,
    marginTop: 10,
    borderRadius: 30 / PixelRatio.get(),
  },
  rectangle11: {
    width: width,
    height: height,
    backgroundColor: "#49D3DA",
    marginRight: 10,
    marginTop: 10,
    borderRadius: 30 / PixelRatio.get(),
  },
  rectangle12: {
    width: width,
    height: height,
    backgroundColor: "#F1EEA1",
    marginRight: 10,
    marginTop: 10,
    borderRadius: 30 / PixelRatio.get(),
  },

  // Navigation bar styling
  navigationBar: {
    backgroundColor: "orange",
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
    margin: 10,
    fontSize: 16,
  },

  // Text styling in buttons
  rectangleButtonText: {
    color:'#fff',
    textAlign:'center',
    fontSize: 14,
    marginTop: 20,
    paddingLeft: 20,
    paddingRight: 20,
  },
})

module.exports = HomePage
