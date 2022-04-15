import * as React from 'react'
import {StyleSheet, Platform, View} from 'react-native'
import * as c from '@frogpond/colors'

const toolbarStyles = StyleSheet.create({
	shadow: {
		backgroundColor: c.white,
		...Platform.select({
			ios: {
				borderBottomWidth: StyleSheet.hairlineWidth,
				borderBottomColor: '#ebebeb',
			},
			android: {
				elevation: 1,
			},
		}),
	},
	container: {
		flexDirection: 'row',
		paddingVertical: 3,
		alignItems: 'center',
	},
})

type ToolbarPropsType = {
	children: React.ReactChildren | JSX.Element
}

export function Toolbar({children}: ToolbarPropsType) {
	return (
		<View style={[toolbarStyles.shadow, toolbarStyles.container]}>
			{children}
		</View>
	)
}
