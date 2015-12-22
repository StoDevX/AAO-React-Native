/**
 * All About Olaf React Native App
 * Drew Volz
 * December 2015
 */
'use strict'

// React native
var React = require('react-native')
// Navigation bar
var NavigationBar = require('react-native-navbar').default
// Device info
var Dimensions = require('Dimensions')

// Namespacing
var {
  AppRegistry,
  Navigator,
  NavigatorIOS,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  View,
} = React

// Screen size information
let Viewport = Dimensions.get('window')
let height = Viewport.height / 7
let margin = Viewport.width / 13
let width = Viewport.width / 2.3

var AllAboutOlaf = React.createClass({
  render: function() {

    // Navigation button config
    var leftButtonConfig = {
        title: 'Info',
        handler: function onNext() {
            alert("HELLO WORLD!")
        }
    }
    // Navigation title config
    var titleConfig = {
        title: 'All About Olaf',
        tintColor: 'white',
    }
    // Status bar config
    var statusBarConfig = {
        style: 'light-content',
        hidden: false,
    }

    // Home screen buttons
    var Rectangle = React.createClass({
        render: function() {
            return (

                <View style={styles.container}>

                    <View style={styles.rectangle1}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Menus
                        </Text>
                    </View>

                    <View style={styles.rectangle2}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            SIS
                        </Text>
                    </View>

                    <View style={styles.rectangle3}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Schedules
                        </Text>
                    </View>

                    <View style={styles.rectangle4}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Calendar
                        </Text>
                    </View>

                    <View style={styles.rectangle5}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Directory
                        </Text>
                    </View>

                    <View style={styles.rectangle6}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Streaming Media
                        </Text>
                    </View>

                    <View style={styles.rectangle7}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            News
                        </Text>
                    </View>

                    <View style={styles.rectangle8}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Campus Map
                        </Text>
                    </View>

                    <View style={styles.rectangle9}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Important Contacts
                        </Text>
                    </View>

                    <View style={styles.rectangle10}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Transportation
                        </Text>
                    </View>

                    <View style={styles.rectangle11}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>
                            Campus Dictionary
                        </Text>
                    </View>

                    <View style={styles.rectangle12}>
                        <Text style={styles.rectangleButtonText}
                              autoAdjustsFontSize={true}>

                        </Text>
                    </View>
                </View>
            )
        }})

    return (
        <View>

            {/* Top navigation bar */}
            <NavigationBar
                title={titleConfig}
                statusBar={statusBarConfig}
                tintColor='orange'
                leftButton={
                    leftButtonConfig} />

            {/* Scroll for buttons */}
            <ScrollView
                automaticallyAdjustContentInsets={false}
                scrollEventThrottle={200}
                overflow={'hidden'}
                alwaysBounceHorizontal={false}
                style={styles.scrollView}>

                {/* Action buttons */}
                <View>
                    <Rectangle></Rectangle>
                </View>

            </ScrollView>

      </View>
    )
  }
})

var styles = StyleSheet.create({
  // Body container
  container: {
    flex: 1,
    paddingLeft: 17,
    marginLeft: margin - 25,
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

  // Text styling in buttons
  rectangleButtonText: {
    color:'#fff',
    textAlign:'center',
    fontSize: 18,
    marginTop: 40,
    paddingLeft: 20,
    paddingRight: 20,
  },
})

AppRegistry.registerComponent('AllAboutOlaf', () => AllAboutOlaf)
