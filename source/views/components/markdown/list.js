// @flow

import * as React from 'react'
import {Text} from 'react-native'
import glamorous from 'glamorous-native'
import {Paragraph} from './formatting'

// the list itself
export const List = glamorous.view({})

// the list item's text
export const ListText = glamorous(Paragraph)({})

// the list item's container box thing
type Props = {
  children?: React.Node,
}

export class ListItem extends React.PureComponent<Props> {
  render() {
    return (
      <glamorous.View flexDirection="row">
        <Text>• </Text>
        <ListText {...this.props} />
      </glamorous.View>
    )
  }
}
