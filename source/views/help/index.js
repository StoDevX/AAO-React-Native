// @flow

import React from 'react'
import {View} from 'react-native'

import {ReportWifiProblemView} from './wifi'

export default class HelpView extends React.Component {
  render() {
    return (
      <View>
        <ReportWifiProblemView />
      </View>
    )
  }
}
