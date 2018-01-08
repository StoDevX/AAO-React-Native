// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Card} from '../components/card'
import {Button} from '../components/button'
import retry from 'p-retry'
import delay from 'delay'
import {reportNetworkProblem} from '../../lib/report-network-problem'
import {Title, Description, Error, ErrorMessage} from './components'
import {getPosition, collectData, reportToServer} from './wifi-tools'

export type ToolName = 'wifi'
export const toolName: ToolName = 'wifi'
export type ToolOptions = {||}

const messages = {
  init: 'Report',
  collecting: 'Collecting data…',
  reporting: 'Reporting data…',
  done: 'Thanks!',
  error: 'Try again?',
}

type Props = {}

type State = {
  error: ?string,
  status: $Keys<typeof messages>,
}

export class ToolView extends React.Component<Props, State> {
  state = {
    error: null,
    status: 'init',
  }

  start = async () => {
    this.setState(() => ({status: 'collecting', error: ''}))
    const [position, device] = await Promise.all([getPosition(), collectData()])
    this.setState(() => ({status: 'reporting'}))
    try {
      let data = {position, device, version: 1}
      await retry(() => reportToServer(data), {retries: 10})
      await delay(1000)
      this.setState(() => ({status: 'done'}))
    } catch (err) {
      reportNetworkProblem(err)
      this.setState(() => ({
        error: 'Apologies; there was an error. Please try again later.',
        status: 'error',
      }))
    }
  }

  render() {
    const buttonMessage = messages[this.state.status] || 'Error'
    const buttonEnabled =
      this.state.status === 'init' || this.state.status === 'error'

    return (
      <Card style={styles.card}>
        <Title selectable={true}>Report a Wi-Fi Problem</Title>

        <Description selectable={true}>
          If you are having an issue connecting to any of the St. Olaf College
          Wi-Fi networks, please tap the button below.
        </Description>
        <Description selectable={true}>
          This information is anonymous, and we do not collect usernames. We
          will record your current location and some general information about
          the device you are using, then send it to a server that IT maintains.
        </Description>
        <Description selectable={true} style={styles.lastParagraph}>
          The networking team can then use this information to identify where
          people are having issues!
        </Description>

        {this.state.error ? (
          <Error>
            <ErrorMessage selectable={true}>{this.state.error}</ErrorMessage>
          </Error>
        ) : null}

        <Button
          disabled={!buttonEnabled}
          onPress={this.start}
          title={buttonMessage}
        />
      </Card>
    )
  }
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 15,
  },
  lastParagraph: {
    marginBottom: 0,
  },
})
