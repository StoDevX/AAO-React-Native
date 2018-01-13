// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Card} from '../components/card'
import {Button} from '../components/button'
import {Title, Description} from './components'

export type ToolName = 'facilities-work-order'
export const toolName: ToolName = 'facilities-work-order'
export type ToolOptions = {|
  key: ToolName,
  enabled: boolean,
  formUrl: string,
|}

type Props = {}

export class ToolView extends React.Component<Props> {
  open = async () => {}

  render() {
    return (
      <Card style={styles.card}>
        <Title selectable={true}>Contact Facilities</Title>

        <Description selectable={true} style={styles.lastParagraph}>
          The networking team can then use this information to identify where
          people are having issues!
        </Description>

        <Button onPress={this.open} title="ring-ring" />
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
