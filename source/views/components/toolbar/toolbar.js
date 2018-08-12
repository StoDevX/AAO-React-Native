// @flow
import * as React from 'react'
import {StyleSheet, Platform, View} from 'react-native'
import * as c from '../colors'
import {Viewport} from '../../components/viewport'

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
		<Viewport
			render={({width}) => {
				const toolbarWidth = {width: width}
				return (
					<View
						style={[
							toolbarStyles.shadow,
							toolbarStyles.container,
							toolbarWidth,
						]}
					>
						{children}
					</View>
				)
			}}
		/>
	)
}
