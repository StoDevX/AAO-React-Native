// @flow
import * as React from 'react'
import {Cell} from 'react-native-tableview-simple'

export const PushButtonCell = ({
  title,
  onPress,
}: {
  title: string,
  onPress: () => any,
}) => (
  <Cell
    accessory="DisclosureIndicator"
    cellStyle="Basic"
    onPress={onPress}
    title={title}
  />
)
