import * as React from 'react'
import {
	StyleProp,
	StyleSheet,
	Text,
	TextStyle,
	View,
	ViewStyle,
} from 'react-native'
import * as c from '@frogpond/colors'

const styles = StyleSheet.create({
	container: {
		paddingLeft: 15,
		paddingVertical: 6,
		paddingRight: 10,
	},
	bold: {
		fontWeight: '500',
	},
	title: {
		fontWeight: '400',
		fontSize: 16,
		color: c.label,
	},
	subtitle: {
		fontWeight: '400',
		fontSize: 16,
		color: c.secondaryLabel,
	},
})

type Props = {
	title: string
	bold?: boolean
	titleStyle?: StyleProp<TextStyle> | null
	subtitle?: string
	subtitleStyle?: StyleProp<TextStyle> | null
	separator?: string
	style?: StyleProp<ViewStyle>
	spacing?: {left?: number; right?: number}
}

export function ListSectionHeader(props: Props): JSX.Element {
	const {
		style,
		title,
		bold = true,
		titleStyle,
		subtitle = null,
		subtitleStyle,
		separator = ' — ',
		spacing: {left: leftSpacing = 15} = {},
	} = props

	let containerTheme: ViewStyle = {paddingLeft: leftSpacing}
	let titleTheme = {}

	containerTheme = {
		...containerTheme,
		backgroundColor: c.systemGroupedBackground,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderTopColor: c.separator,
		borderBottomColor: c.separator,
	}

	const finalTitleStyle = [
		styles.title,
		titleTheme,
		titleStyle,
		bold ? styles.bold : null,
	]

	return (
		<View style={[styles.container, containerTheme, style]}>
			<Text>
				<Text style={finalTitleStyle}>{title}</Text>
				{subtitle ? (
					<Text style={[styles.subtitle, subtitleStyle]}>
						{separator}
						{subtitle}
					</Text>
				) : null}
			</Text>
		</View>
	)
}
