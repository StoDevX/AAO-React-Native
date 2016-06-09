import React from 'react'
import {
  StyleSheet,
  View,
  NetInfo,
  WebView,
} from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  }
})

const URL = 'http://stolaf.cafebonappetit.com/cafe/stav-hall#Lunch'
// const DEFAULT_URL = 'http://legacy.cafebonappetit.com/print-menu/cafe/261/menu/112732/days/today/pgbrks/0/'

export default class StavMenuView extends React.Component {
  constructor() {
    super()
    this.scalesPageToFit = true
    this.url = URL
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
  }

  render() {
    let webViewSource = {uri: this.url}
    return (
      <View style={styles.container}>
        <WebView
          automaticallyAdjustContentInsets={false}
          style={styles.webView}
          source={webViewSource}
          javaScriptEnabled={true}
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
