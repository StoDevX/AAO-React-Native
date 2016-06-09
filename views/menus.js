/**
 * All About Olaf
 * iOS Menus page
 */
'use strict'

const React = require('react')
const RN = require('react-native')
const {
  NetInfo,
  StyleSheet,
  View,
  WebView,
} = RN

const NavigatorScreen = require('./components/navigator-screen')

// FIXME: Don't keep this here… make a general purpose webview and pass url in
// from the router.
const DEFAULT_URL = 'http://stolaf.cafebonappetit.com/cafe/stav-hall#Lunch'
// const DEFAULT_URL = 'http://legacy.cafebonappetit.com/print-menu/cafe/261/menu/112732/days/today/pgbrks/0/'


const HTML = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, user-scalable=no">
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system;
        background: white;
      }
      h1 {
        padding: 45px;
        margin: 0;
        text-align: center;
        color: #000;
      }
    </style>
  </head>
  <body>
    <h1>No Connection</h1>
  </body>
</html>`

class MenusPage extends React.Component {
  constructor() {
    super()
    this.scalesPageToFit = true
    this.url = DEFAULT_URL
    this.state = {
      isConnected: true
    }
  }

  componentWillMount() {
    NetInfo.isConnected.fetch().then(isConnected => {
      this._onConnectivityChange(isConnected)
    })
    NetInfo.isConnected.addEventListener('change', this._onConnectivityChange.bind(this))
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener('change', this._onConnectivityChange.bind(this))
  }

  _onConnectivityChange(isConnected) {
    this.setState({isConnected})
    console.warn('isConnected', isConnected)
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
    let webViewSource = this.state.isConnected
      ? {uri: this.url}
      : {html: HTML}
    return (
      <View style={styles.container}>
        <WebView
          automaticallyAdjustContentInsets={false}
          style={styles.webView}
          source={webViewSource}
          javaScriptEnabled={false}
          onNavigationStateChange={this.onNavigationStateChange.bind(this)}
          onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest.bind(this)}
          startInLoadingState={false}
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
