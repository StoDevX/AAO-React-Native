/**
 * All About Olaf
 * Directory page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  NetInfo,
  WebView,
} from 'react-native'

import NavigatorScreen from './components/navigator-screen'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
})

const URL = 'https://www.stolaf.edu/personal/directory/index.cfm'

export default class DirectoryView extends React.Component {
  constructor() {
    super()
    this.scalesPageToFit = true
    this.url = URL
    this.state = {
      isConnected: true,
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
    return <NavigatorScreen
      {...this.props}
      title='Directory'
      renderScene={this.renderScene.bind(this)}
    />
  }

  renderScene() {
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
