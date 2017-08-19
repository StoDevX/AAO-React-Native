// @flow
import React from 'react'
import {WebView} from 'react-native'

import {NoticeView} from '../components/notice'

import startsWith from 'lodash/startsWith'
import type {TopLevelViewPropsType} from '../types'

const HOME_URL = 'https://www.stolaf.edu/sis/index.cfm'
const LOGIN_URL = 'https://www.stolaf.edu/sis/login.cfm'

export default class SISLoginView extends React.Component {
  props: TopLevelViewPropsType & {onLoginComplete: (status: boolean) => any}

  state = {complete: false}

  onNavigationStateChange = (navState: {url: string}) => {
    console.info(navState.url)
    // If we hit HOME_URL, we know we're logged in.
    if (startsWith(navState.url, HOME_URL)) {
      this.setState({complete: true})
      this.props.onLoginComplete(true)
    }
  }

  onComplete = () => {
    this.props.navigation.goBack()
  }

  render() {
    if (this.state.complete) {
      return (
        <NoticeView
          text="You're logged in!"
          onPress={this.onComplete}
          buttonText="Done"
        />
      )
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
