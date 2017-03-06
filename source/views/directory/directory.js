/**
 * @flow
 * All About Olaf
 * Directory page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  WebView,
} from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

const URL = 'https://www.stolaf.edu/personal/directory/index.cfm'

export default class DirectoryView extends React.Component {
  state = {
    url: URL,
  }

  onNavigationStateChange = (navState: {url: string}) => {
    this.setState({url: navState.url})
  };

  render() {
    return (
      <View style={styles.container}>
        <WebView
          style={styles.webView}
          source={{uri: this.state.url}}
          javaScriptEnabled={true}
          onNavigationStateChange={this.onNavigationStateChange}
          startInLoadingState={true}
          scalesPageToFit={true}
        />
      </View>
    )
  }
}
