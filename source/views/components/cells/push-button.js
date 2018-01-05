// @flow
import * as React from 'react'
import {Cell} from 'react-native-tableview-simple'

type Args = {
  title: string,
  onPress: () => any,
}

export const PushButtonCell = ({title, onPress}: Args) => (
  <Cell
    accessory="DisclosureIndicator"
    cellStyle="Basic"
    onPress={onPress}
    title={title}
  />
)
