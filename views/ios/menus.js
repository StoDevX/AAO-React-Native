/**
 * All About Olaf
 * iOS Menus page
 */
'use strict'

const React = require('react')
const RN = require('react-native')
const {StyleSheet, View, WebView} = RN

const NavigatorScreen = require('./components/navigator-screen')

// FIXME: Don't keep this here… make a general purpose webview and pass url in
// from the router.
const DEFAULT_URL = 'http://stolaf.cafebonappetit.com/cafe/stav-hall#Lunch'
// const DEFAULT_URL = 'http://legacy.cafebonappetit.com/print-menu/cafe/261/menu/112732/days/today/pgbrks/0/'


class MenusPage extends React.Component {
  constructor() {
    super()
    this.scalesPageToFit = true
    this.url = DEFAULT_URL
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title="Menus"
      renderScene={this.renderScene.bind(this)}
    />
  }

  // Render a given scene
  renderScene() {
    return (
      <View style={styles.container}>
        <WebView
          automaticallyAdjustContentInsets={false}
          style={styles.webView}
          source={{uri: this.url}}
          javaScriptEnabled={false}
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



var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

module.exports = MenusPage
