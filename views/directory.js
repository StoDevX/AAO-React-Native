// @flow
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
  state = {
    isConnected: true,
    url: URL,
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

  _onConnectivityChange(isConnected: boolean) {
    this.setState({isConnected})
  }

  renderScene() {
    let webViewSource = {uri: this.state.url}
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
          scalesPageToFit={true}
        />
      </View>
    )
  }

  onShouldStartLoadWithRequest() {
    return true
  }

  onNavigationStateChange(navState: {url: string}) {
    this.setState({url: navState.url})
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title='Directory'
      renderScene={this.renderScene.bind(this)}
    />
  }
}
