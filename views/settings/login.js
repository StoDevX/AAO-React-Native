/**
 * All About Olaf
 * Index view
 */

import React from 'react'
import {
  WebView,
  View,
  Text,
  AsyncStorage,
} from 'react-native'
import startsWith from 'lodash/startsWith'

import CookieManager from 'react-native-cookies'
import LoadingView from '../components/loading'

const HOME_URL = 'https://www.stolaf.edu/sis/index.cfm'
const LOGIN_URL = 'https://www.stolaf.edu/sis/login.cfm'
const AUTH_REJECTED_URL = 'https://www.stolaf.edu/sis/login.cfm?error=access_denied#'


export default class SISLoginView extends React.Component {
  state = {
    loggedIn: false,
    cookieLoaded: false,
  }

  componentWillMount() {
    this.loadCookie()
  }

  loadCookie = () => {
    CookieManager.get(HOME_URL, cookie => {
      let isAuthenticated
      // If it differs, change `cookie.remember_me` to whatever the name for your persistent cookie is!!!
      if (cookie && cookie.indexOf('remember_me') != -1) {
        isAuthenticated = true
      } else {
        isAuthenticated = false
      }

      this.setState({
        loggedIn: isAuthenticated,
        loadedCookie: true,
      })
    })
  }

  logout () {
    CookieManager.clearAll((err, res) => {
      if (err) {
        console.log(err)
      }
      console.log(res)
    })

    this.setState({
      loggedIn: false,
    })
  }

  onNavigationStateChange = navState => {
    // If we get redirected back to the HOME_URL we know that we are logged in. If your backend does something different than this
    // change this line.
    if (startsWith(navState.url, HOME_URL)) {
      AsyncStorage.setItem('credentials:valid', JSON.stringify(true))
      this.setState({
        loggedIn: true,
      })
    } else if (startsWith(navState.url, AUTH_REJECTED_URL)) {
      this.navigator.pop()
    }
  }

  render() {
    // If we have completed loading the cookie choose to show Login WebView or the LoggedIn component, else just show an empty View.
    if (!this.state.loadedCookie) {
      return <LoadingView />
    }
    if (this.state.loggedIn) {
      return <View><Text>Logged in!</Text></View>
    }

    return (
      <WebView
        automaticallyAdjustContentInsets={false}
        source={{uri: LOGIN_URL}}
        javaScriptEnabled={true}
        onNavigationStateChange={this.onNavigationStateChange}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    )
  }
}
