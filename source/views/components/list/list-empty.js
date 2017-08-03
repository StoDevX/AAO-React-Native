// @flow
import React from 'react'
import {View, Text} from 'react-native'

export class ListEmpty extends React.PureComponent {
  props: {
    mode: 'bug',
  }

  render() {
    return <View><Text>List is empty</Text></View>
  }
}
