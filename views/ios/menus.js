/**
 * All About Olaf
 * iOS Menus page
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
  TextInput,
  TouchableOpacity,
  View,
  WebView,
} = React

// Device info
var Dimensions = require('Dimensions')
// Screen size information
let Viewport = Dimensions.get('window')
let marginTop = 60

// URL info
var TEXT_INPUT_REF = 'urlInput';
var WEBVIEW_REF = 'webview';
var DEFAULT_URL = 'http://stolaf.cafebonappetit.com/cafe/stav-hall/#Lunch';

var url = DEFAULT_URL
var status = 'No Page Loaded'
var backButtonEnabled = false
var forwardButtonEnabled = false
var loading = true
var scalesPageToFit = true
var inputText = ''

class MenusPage extends Component {
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

  handleTextInputChange(event) {
    this.inputText = event.nativeEvent.text
  }

  // Render a given scene
  renderScene(route, navigator) {
        this.inputText = TEXT_INPUT_REF;
        return (
          <View style={[styles.container]}>
            <WebView
              ref={WEBVIEW_REF}
              automaticallyAdjustContentInsets={false}
              style={styles.webView}
              url={url}
              javaScriptEnabledAndroid={true}
              onNavigationStateChange={this.onNavigationStateChange}
              onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
              startInLoadingState={true}
              scalesPageToFit={scalesPageToFit}/>
          </View>
        )
  }

  goBack() {
    this.refs[WEBVIEW_REF].goBack()
  }

  goForward() {
    this.refs[WEBVIEW_REF].goForward()
  }

  reload() {
    this.refs[WEBVIEW_REF].reload()
  }

  onShouldStartLoadWithRequest(event) {
       return true;
  }

  onNavigationStateChange(navState) {
      backButtonEnabled = navState.canGoBack
      forwardButtonEnabled = navState.canGoForward
      url = navState.url
      status = navState.title
      loading = navState.loading
      scalesPageToFit = true
  }

  onSubmitEditing(event) {
    this.pressGoButton();
  }

  pressGoButton() {
    var url = this.inputText.toLowerCase();
    if (url === url) {
      this.reload();
    } else {
      this.setState({
        url: url,
      })
    }
       this.refs[TEXT_INPUT_REF].blur();
  }


}

var NavigationBarRouteMapper = {
  // Left button customization
  LeftButton(route, navigator, index, navState) {
    return (
      <TouchableOpacity style={styles.navButton}
          onPress={() => navigator.parentNavigator.pop()}>
        <Text style={styles.navigationButtonText}>
            Back
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
          Menus
        </Text>
      </TouchableOpacity>
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

})

module.exports = MenusPage
