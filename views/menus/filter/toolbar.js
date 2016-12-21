// @flow
import React from 'react'
import {StyleSheet, View, Platform, TouchableOpacity, TouchableNativeFeedback} from 'react-native'
const Touchable = Platform.OS === 'ios' ? TouchableOpacity : TouchableNativeFeedback
const touchableBg = Platform.OS === 'ios' ? null : Touchable.SelectableBackgroundBorderless()

const toolbarStyles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      ios: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ebebeb',
      },
      android: {
        elevation: 4,
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
      <Touchable onPress={onPress} style={{flex: 1}} background={touchableBg}>
        <View style={{flexDirection: 'row'}}>
          {children}
        </View>
      </Touchable>
    </View>
  )
}
