// @flow
import * as React from 'react'
import {View} from 'react-native'

export type PropsType = {children?: any, style?: any, props: mixed}
export const StyledComponent = ({children, style, ...props}: PropsType) => {
  return <View style={[props, style]}>{children}</View>
}
