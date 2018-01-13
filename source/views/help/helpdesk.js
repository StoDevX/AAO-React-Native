// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Card} from '../components/card'
import {Button} from '../components/button'
import {Title, Quote} from './components'

export type ToolName = 'it-helpdesk'
export const toolName: ToolName = 'it-helpdesk'
export type ToolOptions = {|
  key: ToolName,
  enabled: boolean,
  ticketSubmissionPage: string,
  emailTemplate: string,
  emailAddress: string,
|}

type Props = {}

export class ToolView extends React.Component<Props> {
  open = async () => {}

  render() {
    return (
      <Card style={styles.card}>
        <Title selectable={true}>Open a Helpdesk Ticket</Title>

        <Quote selectable={true} style={styles.lastParagraph}>
          If there’s something strange{'\n'}
          in you neighborhood{'\n'}
          Who you gonna call?
        </Quote>

        <Button onPress={this.open} title="Submit Ticket" />
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
