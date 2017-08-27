// @flow

import React from 'react'
import {View} from 'react-native'

import {ReportWifiProblemView} from './wifi'

export class HelpView extends React.Component {
  static navigationOptions = {
    title: 'Help',
  }

  render() {
    return (
      <View>
        <ReportWifiProblemView />
      </View>
    )
  }
}
