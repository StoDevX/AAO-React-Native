// @flow
/**
 * All About Olaf
 * Building Hours list page
 */

import React from 'react'
import {
  TouchableOpacity,
  TouchableHighlight,
  TouchableNativeFeedback,
  Platform,
  View,
} from 'react-native'

export const Touchable = ({
  highlight=true,
  children,
  onPress=() => {},
  borderless=false,
  style,
  ...props
}: {
  highlight?: boolean,
  onPress?: () => any,
  children?: any,
  borderless?: boolean,
  style?: any,
}) => {
  // The child <View> is required; the Touchable needs a View as its direct child.
  switch (Platform.OS) {
    case 'ios':
    default: {
      if (highlight) {
        return (
          <TouchableHighlight onPress={onPress} underlayColor='#ebebeb' {...props}>
            <View style={style}>
              {children}
            </View>
          </TouchableHighlight>
        )
      }
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.65} {...props}>
          <View style={style}>
            {children}
          </View>
        </TouchableOpacity>
      )
    }
    case 'android': {
      const background = borderless
        ? TouchableNativeFeedback.SelectableBackgroundBorderless()
        : TouchableNativeFeedback.SelectableBackground()
      return (
        <TouchableNativeFeedback onPress={onPress} background={background} {...props}>
          <View style={style}>
            {children}
          </View>
        </TouchableNativeFeedback>
      )
    }
  }
}
