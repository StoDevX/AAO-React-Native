/**
 * All About Olaf
 * iOS Menus page
 */

import React from 'react'
import {
  NetInfo,
  StyleSheet,
  View,
  WebView,
} from 'react-native'

import NavigatorScreen from './components/navigator-screen'

// FIXME: Don't keep this here… make a general purpose webview and pass url in
// from the router.
const DEFAULT_URL = 'http://stolaf.cafebonappetit.com/cafe/stav-hall#Lunch'
// const DEFAULT_URL = 'http://legacy.cafebonappetit.com/print-menu/cafe/261/menu/112732/days/today/pgbrks/0/'

export default class MenusPage extends React.Component {
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
    let webViewSource = {uri: this.url}
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


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
