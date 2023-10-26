import * as React from 'react'
import {Platform, StyleProp, StyleSheet, ViewStyle} from 'react-native'

import {Separator} from '@frogpond/separator'

const styles = StyleSheet.create({
	separator: {
		marginLeft: 15,
	},
})

type Props = {
	styles?: StyleProp<ViewStyle>
	fullWidth?: boolean
	spacing?: {left?: number; right?: number}
	force?: boolean
}

export function ListSeparator(props: Props): JSX.Element | null {
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
): JSX.Element {
	return <ListSeparator fullWidth={true} {...props} />
}
