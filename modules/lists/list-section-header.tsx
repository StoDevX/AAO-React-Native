import * as React from 'react'
import {
	Platform,
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
		...Platform.select({
			ios: {
				paddingVertical: 6,
				paddingRight: 10,
			},
			android: {
				paddingTop: 10,
				paddingBottom: 10,
				borderTopWidth: 1,
				borderBottomWidth: 0,
				paddingRight: 15,
			},
		}),
	},
	bold: {
		...Platform.select({
			ios: {fontWeight: '500'},
			android: {fontWeight: '600'},
		}),
	},
	title: {
		fontWeight: '400',
		...Platform.select({
			ios: {
				fontSize: 16,
				color: c.label,
			},
			android: {
				fontSize: 16,
				fontFamily: 'sans-serif-condensed',
			},
		}),
	},
	subtitle: {
		fontWeight: '400',
		...Platform.select({
			ios: {
				fontSize: 16,
				color: c.secondaryLabel,
			},
			android: {
				fontSize: 16,
				fontFamily: 'sans-serif-condensed',
				color: c.secondaryLabel, // todo: find android equivalent
			},
		}),
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

	if (Platform.OS === 'android') {
		containerTheme = {
			...containerTheme,
			backgroundColor: c.systemGroupedBackground,
		}
		titleTheme = {
			...titleTheme,
			color: c.label,
		}
	} else if (Platform.OS === 'ios') {
		containerTheme = {
			...containerTheme,
			backgroundColor: c.systemGroupedBackground,
			borderTopWidth: StyleSheet.hairlineWidth,
			borderBottomWidth: StyleSheet.hairlineWidth,
			borderTopColor: c.separator,
			borderBottomColor: c.separator,
		}
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
