import * as React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import * as c from '@frogpond/colors'

const solidBarStyles = StyleSheet.create({
	border: {
		width: 1.5,
		backgroundColor: c.separator,
	},
})

function SolidBar({style}: Props) {
	return <View style={[solidBarStyles.border, style]} />
}

type Props = {
	style?: StyleProp<ViewStyle>
}

export function Bar(props: Props): JSX.Element {
	return <SolidBar {...props} />
}
