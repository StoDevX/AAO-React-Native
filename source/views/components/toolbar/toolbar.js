// @flow
import * as React from 'react'
import {StyleSheet, Platform, View} from 'react-native'
import {Touchable} from '../touchable'
import * as c from '../colors'

const toolbarStyles = StyleSheet.create({
  shadow: {
    backgroundColor: c.white,
    ...Platform.select({
      ios: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ebebeb',
      },
      android: {
        elevation: 1,
      },
    }),
  },
  container: {
    flexDirection: 'row',
  },
})

type ToolbarPropsType = {
  children?: any,
  onPress: () => any,
}

export function Toolbar({children, onPress}: ToolbarPropsType) {
  return (
    <View style={toolbarStyles.shadow}>
      <Touchable
        borderless={true}
        onPress={onPress}
        style={toolbarStyles.container}
      >
        {children}
      </Touchable>
    </View>
  )
}
