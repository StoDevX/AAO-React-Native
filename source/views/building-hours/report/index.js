/**
 * @flow
 *
 * Building Hours "report a problem" screen.
 */

import React from 'react'
import {ScrollView, Text, StyleSheet} from 'react-native'
import {TableView, Section, Cell} from 'react-native-tableview-simple'

export class BuildingHoursProblemReportView extends React.PureComponent {
  static navigationOptions = {
    title: 'Report a Problem',
  }

  render() {
    return (
      <ScrollView>
        <Text>
          Thanks for spotting a problem! If you could tell us what the new times
          are, we'd greatly appreciate it.
        </Text>

        <TableView>
          <Section header="SUNDAY">
            <Cell title="Closed" />
            <Cell title="Opens:" />
            <Cell title="Closes:" />
          </Section>
        </TableView>
      </ScrollView>
    )
  }
}
