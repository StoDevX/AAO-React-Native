import * as React from 'react'
import {View} from 'react-native'
import type {ViewStyle} from 'react-native'

export interface PropsType extends ViewStyle {
	children?: React.ReactNode
	style?: ViewStyle
}

export const StyledComponent = ({children, style, ...props}: PropsType) => {
	return <View style={[props, style]}>{children}</View>
}
