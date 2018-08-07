// @flow
import * as React from 'react'
import {StyleSheet, Platform, View, ScrollView} from 'react-native'
import * as c from '../colors'

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
	},
})

type ToolbarPropsType = {
	children?: any,
}

export function Toolbar({children}: ToolbarPropsType) {
	return (
		<View style={[toolbarStyles.shadow, toolbarStyles.container]}>
			<ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
				{children}
			</ScrollView>
		</View>
	)
}
