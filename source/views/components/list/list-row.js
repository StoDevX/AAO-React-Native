// @flow
import * as React from 'react'
import {Platform, StyleSheet, View} from 'react-native'
import * as c from '../colors'
import {Touchable} from '../touchable'
import {DisclosureArrow} from './disclosure-arrow'
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
	centeredArrow: {
		alignSelf: 'center',
	},
	topAlignedArrow: {
		alignSelf: 'flex-start',
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

	const arrowPosition = props.arrowPosition || (onPress ? 'center' : 'none')
	const arrowPositionStyle =
		arrowPosition === 'center' ? styles.centeredArrow : styles.topAlignedArrow
	const arrow =
		arrowPosition === 'none' || Platform.OS === 'android' ? null : (
			<DisclosureArrow style={arrowPositionStyle} />
		)

	const outerStyles = [
		styles.container,
		!isNil(leftSpacing) && {paddingLeft: leftSpacing},
		!isNil(rightSpacing) && {paddingRight: rightSpacing},
		fullWidth && styles.fullWidth,
		fullHeight && styles.fullHeight,
		contentContainerStyle,
	]

	const childs = (
		<React.Fragment>
			<View style={[styles.childWrapper, style]}>{children}</View>
			{arrow}
		</React.Fragment>
	)

	if (onPress) {
		return (
			<Touchable onPress={onPress} style={outerStyles}>
				{childs}
			</Touchable>
		)
	}

	return <View style={outerStyles}>{childs}</View>
}
