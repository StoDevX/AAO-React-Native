// @flow
import React from 'react'
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
};
export const Touchable = ({
  children,
  style,
  highlight=true,
  borderless=false,
  onPress=() => {},
  ...props
}: PropsType) => {
  // The child <View> is required; the Touchable needs a View as its direct child.
  const content = <View style={style}>{children}</View>

  switch (Platform.OS) {
    case 'ios':
    default: {
      const Component = highlight ? TouchableHighlight : TouchableOpacity
      const innerProps = highlight ? {underlayColor: '#ebebeb'} : {activeOpacity: 0.65}
      return (
        <Component onPress={onPress} {...innerProps} {...props}>
          {content}
        </Component>
      )
    }
    case 'android': {
      const background = borderless
        ? TouchableNativeFeedback.SelectableBackgroundBorderless()
        : TouchableNativeFeedback.SelectableBackground()
      return (
        <TouchableNativeFeedback onPress={onPress} background={background} {...props}>
          {content}
        </TouchableNativeFeedback>
      )
    }
  }
}
