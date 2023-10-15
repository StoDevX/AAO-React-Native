import * as React from 'react'
import {PropsWithChildren} from 'react'
import {Platform, StyleSheet, View} from 'react-native'
import * as c from '@frogpond/colors'

const toolbarStyles = StyleSheet.create({
	shadow: {
		backgroundColor: c.systemBackground,
		...Platform.select({
			ios: {
				borderBottomWidth: StyleSheet.hairlineWidth,
				borderBottomColor: c.separator,
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

type ToolbarPropsType = PropsWithChildren<unknown>

export function Toolbar({children}: ToolbarPropsType): JSX.Element {
	return (
		<View style={[toolbarStyles.shadow, toolbarStyles.container]}>
			{children}
		</View>
	)
}
