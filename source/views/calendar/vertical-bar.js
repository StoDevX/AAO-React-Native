// @flow
import * as React from 'react'
import {StyleSheet, View, Platform} from 'react-native'
import * as c from '../components/colors'
import type {ViewStyleProp} from '../types'

const dotBarStyles = StyleSheet.create({
	diagram: {
		marginTop: 9,
		marginBottom: 8,
		flexDirection: 'column',
		alignItems: 'center',
	},
	circle: {
		height: 5,
		width: 5,
		borderRadius: 5,
		backgroundColor: c.tint,
	},
	line: {
		width: 1,
		backgroundColor: c.tint,
		flex: 1,
	},
})

type Props = {style?: ViewStyleProp}

function DottedBar({style}: Props) {
	return (
		<View style={[dotBarStyles.diagram, style]}>
			<View style={dotBarStyles.circle} />
			<View style={dotBarStyles.line} />
			<View style={dotBarStyles.circle} />
		</View>
	)
}

const solidBarStyles = StyleSheet.create({
	border: {
		width: 1.5,
		backgroundColor: c.black75Percent,
	},
})

function SolidBar({style}: Props) {
	return <View style={[solidBarStyles.border, style]} />
}

export function Bar(props: Props) {
	switch (Platform.OS) {
		case 'ios':
			return <SolidBar {...props} />
		case 'android':
			return <DottedBar {...props} />
		default:
			return <SolidBar {...props} />
	}
}
