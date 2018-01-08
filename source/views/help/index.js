// @flow

import * as React from 'react'
import {ScrollView, StyleSheet, View, Text} from 'react-native'
import * as wifi from './wifi'
import * as helpdesk from './helpdesk'
import * as facilities from './facilities'

export type ReportProblemToolNamesEnum =
  | wifi.ToolName
  | facilities.ToolName
  | helpdesk.ToolName

export type ReportProblemToolOptions = {
  wifi?: wifi.ToolOptions,
  'it-helpdesk'?: helpdesk.ToolOptions,
  'facilities-work-order'?: facilities.ToolOptions,
}

type Props = {
  enabledTools: Array<ReportProblemToolNamesEnum>,
  toolOptions: ReportProblemToolOptions,
}

export default class HelpView extends React.Component<Props> {
  static navigationOptions = {
    title: 'Help',
  }

  render() {
    const allTools = [wifi, helpdesk, facilities]
    const enabled = allTools
      .filter(tool => this.props.enabledTools.includes(tool.toolName))
      .map(tool => (
        <tool.ToolView
          key={tool.toolName}
          options={this.props.toolOptions[tool.toolName]}
        />
      ))

    return (
      <ScrollView style={styles.contentContainer}>
        {enabled.length ? enabled : <EmptyListView />}
      </ScrollView>
    )
  }
}

const EmptyListView = () => (
  <View>
    <Text>No tools are enabled.</Text>
  </View>
)

const styles = StyleSheet.create({
  contentContainer: {
    paddingTop: 10,
  },
})
