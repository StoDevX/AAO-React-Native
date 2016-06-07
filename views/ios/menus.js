/**
 * All About Olaf
 * iOS Menus page
 */
'use strict'

// React native
const React = require('react')
const RN = require('react-native')

// Namespacing
const {
  Navigator,
  StyleSheet,
  Text,
  View,
  WebView,
} = RN

// Device info
let marginTop = 60

const backButton = require('./back-button')

// URL info
const WEBVIEW_REF = 'webview'

// Note: Fix me.
// 1. Don't keep this here... make a general purpose webview and pass url in from the router.
// 2. Also, pull this string in from existing Parse database to ensure up-to-date info.
// 3. A bunch of leftover history forwards/backwards/text input ref/webview ref things
//    exist but are not used. Maybe redo the router so you can construct apps the "react way"
const DEFAULT_URL = 'http://stolaf.cafebonappetit.com/cafe/stav-hall#Lunch'


/******************************************
 *
 *           MenusPage Class
 *
 *****************************************/

class MenusPage extends React.Component {
  constructor() {
    super()
    this.scalesPageToFit = true
    this.url = DEFAULT_URL
  }

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

  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <WebView
          ref={WEBVIEW_REF}
          automaticallyAdjustContentInsets={false}
          style={styles.webView}
          source={{uri: this.url}}
          javaScriptEnabledAndroid={true}
          onNavigationStateChange={this.onNavigationStateChange.bind(this)}
          onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest.bind(this)}
          startInLoadingState={true}
          scalesPageToFit={this.scalesPageToFit}
        />
      </View>
    )
  }

  onShouldStartLoadWithRequest() {
    return true
  }

  onNavigationStateChange(navState) {
    this.url = navState.url
    this.scalesPageToFit = true
  }
}


var NavigationBarRouteMapper = {
  // Left button customization
  LeftButton(route, navigator) {
    return backButton(navigator)
  },
  // Right button customization
  RightButton() {
    return null
  },
  // Title customization
  Title() {
    return (
      <Text style={styles.navigationText}>
        Menus
      </Text>
    )
  }
}


var styles = StyleSheet.create({
  // Body container
  container: {
    flex: 1,
    marginTop: marginTop,
    flexDirection:'row',
    flexWrap:'wrap',
  },

  // Navigation bar styling
  navigationBar: {
    backgroundColor: 'orange',
  },
  navigationText: {
    color: 'white',
    margin: 10,
    fontSize: 16,
  },

})

module.exports = MenusPage
