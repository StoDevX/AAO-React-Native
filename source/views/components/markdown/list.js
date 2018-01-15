// @flow

import * as React from 'react'
import glamorous, {View, Text} from 'glamorous-native'
import {Paragraph} from './formatting'

// the list itself
export const List = glamorous(View)({})

// the list item's text
export const ListText = glamorous(Paragraph)({
  flex: 1,
})

// the list item's container box thing
type Props = {
  children?: React.Node,
}

export class ListItem extends React.PureComponent<Props> {
  render() {
    return (
      <View alignItems="center" flexDirection="row">
        <Text paddingRight={4}>• </Text>
        <ListText {...this.props} />
      </View>
    )
  }
}
