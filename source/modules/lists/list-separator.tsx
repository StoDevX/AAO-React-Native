import * as React from 'react'
import {Platform, StyleProp, StyleSheet, ViewStyle} from 'react-native'
import {Separator} from '../separator'

const styles = StyleSheet.create({
	separator: {
		marginLeft: 15,
	},
})

interface Props {
	styles?: StyleProp<ViewStyle>
	fullWidth?: boolean
	spacing?: {left?: number; right?: number}
	force?: boolean
}

export function ListSeparator(props: Props): React.JSX.Element | null {
	if (Platform.OS === 'android' && !props.force) {
		return null
	}

	const {
		fullWidth,
		spacing: {left: leftSpacing = 15, right: rightSpacing} = {},
	} = props

	const spacing = {
		marginLeft: leftSpacing,
		marginRight: rightSpacing,
	}

	if (fullWidth) {
		spacing.marginLeft = 0
		spacing.marginRight = 0
	}

	return <Separator style={[styles.separator, spacing, props.styles]} />
}

export function FullWidthSeparator<T extends Record<string, unknown>>(
	props: T,
): React.JSX.Element {
	return <ListSeparator fullWidth={true} {...props} />
}
