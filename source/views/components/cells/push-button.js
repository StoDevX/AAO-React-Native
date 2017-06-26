// @flow
import React from 'react'
import {Cell} from 'react-native-tableview-simple'

export const PushButtonCell = ({
  title,
  onPress,
}: {
  title: string,
  onPress: () => any,
}) =>
  <Cell
    cellStyle="Basic"
    title={title}
    accessory="DisclosureIndicator"
    onPress={onPress}
  />
