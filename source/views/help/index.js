// @flow

import * as React from 'react'
import {ScrollView, StyleSheet} from 'react-native'

import {ReportWifiProblemView} from './wifi'

type Props = {}

export default class HelpView extends React.Component<Props> {
  static navigationOptions = {
    title: 'Help',
  }

  render() {
    return (
      <ScrollView style={styles.contentContainer}>
        <ReportWifiProblemView />
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 10,
  },
})
