// @flow

import * as React from 'react'
import {View, Text} from 'react-native'

type Props = {}
type State = {}

class FoodTab extends React.PureComponent<Props, State> {
  render() {
    return (
      <View>
        <Text>foo</Text>
      </View>
    )
  }
}

export {FoodTab}
