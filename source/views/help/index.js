// @flow

import * as React from 'react'
import {connect} from 'react-redux'
import {ScrollView, StyleSheet, View, Text} from 'react-native'
import {type TopLevelViewPropsType} from '../types'
import {type ReduxState} from '../../flux'
import {getEnabledTools} from '../../flux/parts/help'
import * as wifi from './wifi'
import * as helpdesk from './helpdesk'
import * as facilities from './facilities'

const ALL_TOOLS = [wifi, helpdesk, facilities]

export type ReportProblemToolNamesEnum =
  | wifi.ToolName
  | facilities.ToolName
  | helpdesk.ToolName

export type ReportProblemTools =
  | wifi.ToolOptions
  | helpdesk.ToolOptions
  | facilities.ToolOptions

type ReduxStateProps = {
  fetching: boolean,
  tools: Array<ReportProblemTools>,
}

type ReduxDispatchProps = {
  getEnabledTools: () => mixed,
}

type Props = TopLevelViewPropsType & ReduxStateProps & ReduxDispatchProps

export class HelpView extends React.Component<Props> {
  static navigationOptions = {
    title: 'Help',
  }

  componentWillMount() {
    this.props.getEnabledTools()
  }

  render() {
    if (this.props.fetching) {
      return <LoadingScreen />
    }

    const tools = ALL_TOOLS.map(tool => [
      tool,
      this.props.tools.find(conf => conf.key === tool.toolName),
    ])

    const views = tools.map(
      ([tool, config]) =>
        config ? <tool.ToolView key={config.key} options={config} /> : null,
    )

    return (
      <ScrollView style={styles.contentContainer}>
        {views.length ? views : <EmptyListView />}
      </ScrollView>
    )
  }
}

function mapState(state: ReduxState): ReduxStateProps {
  if (!state.help) {
    return {
      fetching: false,
      tools: [],
    }
  }

  return {
    fetching: state.help.fetching,
    tools: state.help.tools,
    lastFetchError: state.help.lastFetchError,
  }
}

function mapDispatch(dispatch): ReduxDispatchProps {
  return {
    getEnabledTools: () => dispatch(getEnabledTools()),
  }
}

export default connect(mapState, mapDispatch)(HelpView)

const EmptyListView = () => (
  <View>
    <Text>No tools are enabled.</Text>
  </View>
)

const LoadingScreen = () => (
  <View>
    <Text>Loading…</Text>
  </View>
)

const styles = StyleSheet.create({
  contentContainer: {
    paddingTop: 10,
  },
})
