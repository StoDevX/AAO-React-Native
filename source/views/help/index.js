// @flow

import * as React from 'react'
import {View} from 'react-native'

import {ReportWifiProblemView} from './wifi'

type Props = {}

export default class HelpView extends React.Component<Props> {
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
