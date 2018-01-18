// @flow
import * as React from 'react'
import {Platform, StyleSheet, View} from 'react-native'
import * as c from '../colors'
import {Touchable} from '../touchable'
import {DisclosureArrow} from './disclosure-arrow'
import noop from 'lodash/noop'
import isNil from 'lodash/isNil'

const styles = StyleSheet.create({
	childWrapper: {
		flex: 1,
	},
	container: {
		flexDirection: 'row',
		paddingLeft: 15,
		backgroundColor: c.white,
		...Platform.select({
			ios: {
				paddingVertical: 8,
				paddingRight: 8,
			},
			android: {
				paddingVertical: 16,
				paddingRight: 15,
			},
		}),
	},
	fullWidth: {
		paddingLeft: 0,
	},
	fullHeight: {
		paddingVertical: 0,
	},
})

type PropsType = {|
	style?: any,
	contentContainerStyle?: any,
	arrowPosition?: 'center' | 'top' | 'none',
	fullWidth?: boolean,
	fullHeight?: boolean,
	spacing?: {left?: number, right?: number},
	onPress?: () => any,
	children?: any,
|}
export function ListRow(props: PropsType) {
	const {
		style,
		contentContainerStyle,
		children,
		onPress,
		spacing: {left: leftSpacing = 15, right: rightSpacing = null} = {},
		fullWidth = false,
		fullHeight = false,
	} = props

	const Component = onPress ? Touchable : View
	const callback = onPress || noop

	const arrowPosition = props.arrowPosition || (onPress ? 'center' : 'none')
	const arrowPositionStyle = {
		alignSelf: arrowPosition === 'center' ? 'center' : 'flex-start',
	}
	const arrow =
		arrowPosition === 'none' || Platform.OS === 'android' ? null : (
			<DisclosureArrow style={arrowPositionStyle} />
		)

	return (
		<Component
			onPress={callback}
			style={[
				styles.container,
				!isNil(leftSpacing) && {paddingLeft: leftSpacing},
				!isNil(rightSpacing) && {paddingRight: rightSpacing},
				fullWidth && styles.fullWidth,
				fullHeight && styles.fullHeight,
				contentContainerStyle,
			]}
		>
			<View style={[styles.childWrapper, style]}>{children}</View>
			{arrow}
		</Component>
	)
}
