// @flow
import React from 'react'
import {StyleSheet, View, Platform} from 'react-native'
import {Touchable} from '../touchable'

const toolbarStyles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      ios: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ebebeb',
      },
      android: {
        elevation: 3,
      },
    }),
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    justifyContent: 'center',
  },
})

type ToolbarPropsType = {
  children?: any,
  onPress: () => any,
};

export function Toolbar({children, onPress}: ToolbarPropsType) {
  return (
    <View style={[toolbarStyles.shadow, toolbarStyles.container]}>
      <Touchable onPress={onPress} style={{flex: 1, flexDirection: 'row'}} borderless>
        {children}
      </Touchable>
    </View>
  )
}
