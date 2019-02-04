// @flow
import * as React from 'react'
import {View} from 'react-native'
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet'

export type PropsType = {
	children?: React.Node,
	style?: ViewStyleProp,
	props: ViewStyleProp,
}
export const StyledComponent = ({children, style, ...props}: PropsType) => {
	return <View style={[(props: any), style]}>{children}</View>
}
