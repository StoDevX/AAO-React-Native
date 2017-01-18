// @flow
import React from 'react'
import {WebView} from 'react-native'

import startsWith from 'lodash/startsWith'
import {setTokenValid} from '../../lib/storage'
import type {TopLevelViewPropsType} from '../types'

const HOME_URL = 'https://www.stolaf.edu/sis/index.cfm'
const LOGIN_URL = 'https://www.stolaf.edu/sis/login.cfm'

export default class SISLoginView extends React.Component {
  props: TopLevelViewPropsType;

  onNavigationStateChange = (navState: {url: string}) => {
    // If we hit HOME_URL, we know we're logged in.
    if (startsWith(navState.url, HOME_URL)) {
      setTokenValid(true)
    }

    this.props.navigator.pop()
  }

  render() {
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
