// @flow
import * as React from 'react'
import {Platform, StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'
import {type AppTheme} from '@frogpond/app-theme'
import {useTheme} from '@frogpond/app-theme'
import type {
	ViewStyleProp,
	TextStyleProp,
} from 'react-native/Libraries/StyleSheet/StyleSheet'

const styles = StyleSheet.create({
	container: {
		paddingLeft: 15,
		...Platform.select({
			ios: {
				backgroundColor: c.iosListSectionHeader,
				paddingVertical: 6,
				borderTopWidth: StyleSheet.hairlineWidth,
				borderBottomWidth: StyleSheet.hairlineWidth,
				borderTopColor: c.iosHeaderTopBorder,
				borderBottomColor: c.iosHeaderBottomBorder,
				paddingRight: 10,
			},
			android: {
				paddingTop: 10,
				paddingBottom: 10,
				borderTopWidth: 1,
				borderBottomWidth: 0,
				borderColor: '#c8c7cc',
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
				color: c.black,
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
				color: c.iosDisabledText,
			},
			android: {
				fontSize: 16,
				fontFamily: 'sans-serif-condensed',
				color: c.iosDisabledText, // todo: find android equivalent
			},
		}),
	},
})

type Props = {
	title: string,
	bold?: boolean,
	titleStyle?: TextStyleProp,
	subtitle?: string,
	subtitleStyle?: TextStyleProp,
	separator?: string,
	style?: ViewStyleProp,
	spacing?: {left?: number, right?: number},
}

export function ListSectionHeader(props: Props) {
	let {
		style,
		title,
		bold = true,
		titleStyle,
		subtitle = null,
		subtitleStyle,
		separator = ' — ',
		spacing: {left: leftSpacing = 15} = {},
	} = props

	let theme: AppTheme = useTheme()

	let containerTheme = {paddingLeft: leftSpacing}
	let titleTheme = {}

	if (Platform.OS === 'android') {
		containerTheme = {
			...containerTheme,
			backgroundColor: theme.androidListHeaderBackground,
		}
		titleTheme = {
			...titleTheme,
			color: theme.androidListHeaderForeground,
		}
	}

	let finalTitleStyle = [
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
