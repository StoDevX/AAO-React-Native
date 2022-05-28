import * as React from 'react'
import {PropsWithChildren} from 'react'
import {Platform, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import * as c from '@frogpond/colors'
import {Touchable} from '@frogpond/touchable'
import {DisclosureArrow} from './disclosure-arrow'

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

type PropsType = PropsWithChildren<{
	style?: StyleProp<ViewStyle>
	contentContainerStyle?: StyleProp<ViewStyle>
	arrowPosition?: 'center' | 'top' | 'none'
	fullWidth?: boolean
	fullHeight?: boolean
	spacing?: {left?: number; right?: number}
	onPress?: () => void
}>

export function ListRow(props: PropsType): JSX.Element {
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
	const arrowPositionStyle: ViewStyle = {
		alignSelf: arrowPosition === 'center' ? 'center' : 'flex-start',
	}
	const arrow =
		arrowPosition === 'none' || Platform.OS === 'android' ? null : (
			<DisclosureArrow style={arrowPositionStyle} />
		)

	const wrapperStyle = [
		styles.container,
		leftSpacing != null && {paddingLeft: leftSpacing},
		rightSpacing != null && {paddingRight: rightSpacing},
		fullWidth && styles.fullWidth,
		fullHeight && styles.fullHeight,
		contentContainerStyle,
	]

	const content = (
		<>
			<View style={[styles.childWrapper, style]}>{children}</View>
			{arrow}
		</>
	)

	if (onPress) {
		return (
			<Touchable onPress={onPress} style={wrapperStyle}>
				{content}
			</Touchable>
		)
	}

	return <View style={wrapperStyle}>{content}</View>
}
