/**
 * All About Olaf
 * Index view
 */

import React from 'react'
import {
  WebView,
  View,
  Text,
  Navigator,
} from 'react-native'
import startsWith from 'lodash/startsWith'

import {setTokenValid} from '../../lib/login'
import LoadingView from '../components/loading'

const HOME_URL = 'https://www.stolaf.edu/sis/index.cfm'
const LOGIN_URL = 'https://www.stolaf.edu/sis/login.cfm'
const AUTH_REJECTED_URL = 'https://www.stolaf.edu/sis/login.cfm?error=access_denied#'


export default class SISLoginView extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.instanceOf(Navigator),
    onLoginComplete: React.PropTypes.func,
  };

  static defaultProps = {
    onLoginComplete: () => {},
  };

  state = {
    loggedIn: false,
    cookieLoaded: false,
  };

  componentWillMount() {
    this.loadCookie()
  }

  loadCookie = () => {
    // this.props.onLoginComplete(isAuthenticated)
  }

  logout () {
    this.setState({
      loggedIn: false,
    })
  }

  onNavigationStateChange = navState => {
    // If we get redirected back to the HOME_URL we know that we are logged in. If your backend does something different than this
    // change this line.
    if (startsWith(navState.url, HOME_URL)) {
      setTokenValid(true)
      this.setState({
        loggedIn: true,
      })
      // TODO: figure out a way to do this that doesn't involve reaching
      // into the parent? But this migth be the good way. Think about it.
      this.props.onLoginComplete(true)
      this.props.navigator.pop()
    } else if (startsWith(navState.url, AUTH_REJECTED_URL)) {
      this.props.onLoginComplete(false)
      this.props.navigator.pop()
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
        source={{uri: LOGIN_URL}}
        javaScriptEnabled={true}
        onNavigationStateChange={this.onNavigationStateChange}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    )
  }
}
