// @flow
import React from 'react'
import {WebView, View, Button, Text} from 'react-native'

import {Section, CustomCell, Cell} from 'react-native-tableview-simple'

import startsWith from 'lodash/startsWith'
import type {TopLevelViewPropsType} from '../types'

const HOME_URL = 'https://www.stolaf.edu/sis/index.cfm'
const LOGIN_URL = 'https://www.stolaf.edu/sis/login.cfm'

export default class SISLoginView extends React.Component {
  state = {complete: false};

  props: TopLevelViewPropsType & {onLoginComplete: (status: boolean) => any};

  onNavigationStateChange = (navState: {url: string}) => {
    console.info(navState.url)
    // If we hit HOME_URL, we know we're logged in.
    if (startsWith(navState.url, HOME_URL)) {
      this.setState({complete: true})
      this.props.onLoginComplete(true)
    }
  }

  onComplete = () => {
    this.props.navigator.pop()
  }

  render() {
    if (this.state.complete) {
      return (
        <Section>
          <Cell title="You're logged in!" />
          <CustomCell>
            <Button onPress={this.onComplete} title='Done' />
          </CustomCell>
        </Section>
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
