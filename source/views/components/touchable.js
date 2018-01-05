// @flow
import * as React from 'react'
import {
  TouchableOpacity,
  TouchableHighlight,
  TouchableNativeFeedback,
  Platform,
  View,
} from 'react-native'

type PropsType = {
  highlight?: boolean,
  onPress?: () => any,
  children?: any,
  borderless?: boolean,
  style?: any,
  containerStyle?: any,
}
export const Touchable = ({
  children,
  style,
  highlight = true,
  borderless = false,
  onPress = () => {},
  containerStyle,
  ...props
}: PropsType) => {
  // The child <View> is required; the Touchable needs a View as its direct child.
  const content = <View style={style}>{children}</View>

  switch (Platform.OS) {
    default:
    case 'ios': {
      const Component = highlight ? TouchableHighlight : TouchableOpacity
      const innerProps = highlight
        ? {underlayColor: '#d9d9d9'}
        : {activeOpacity: 0.65}
      return (
        <Component
          onPress={onPress}
          {...innerProps}
          style={containerStyle}
          {...props}
        >
          {content}
        </Component>
      )
    }
    case 'android': {
      const canBorderless = Platform.Version >= 21
      const background =
        borderless && canBorderless
          ? TouchableNativeFeedback.SelectableBackgroundBorderless()
          : TouchableNativeFeedback.SelectableBackground()
      return (
        <TouchableNativeFeedback
          background={background}
          onPress={onPress}
          style={containerStyle}
          {...props}
        >
          {content}
        </TouchableNativeFeedback>
      )
    }
  }
}
