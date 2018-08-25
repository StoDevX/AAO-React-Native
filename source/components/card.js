// @flow
import * as React from 'react'
import {View, Text, StyleSheet, Platform} from 'react-native'
import {material, iOSUIKit} from 'react-native-typography'
import * as c from './colors'

const cardStyles = StyleSheet.create({
	card: {
		marginHorizontal: 10,
		paddingHorizontal: 10,
		paddingBottom: 4,
		backgroundColor: c.white,
		borderRadius: 2,
		elevation: 2,
	},
	title: {
		paddingTop: 8,
		paddingBottom: 6,
	},
	titleText: {
		...Platform.select({
			ios: iOSUIKit.title3Object,
			android: material.titleObject,
		}),
	},
	footerText: {
		...Platform.select({
			ios: iOSUIKit.footnoteObject,
			android: material.captionObject,
		}),
	},
	footer: {
		borderTopWidth: 1,
		borderTopColor: c.androidSeparator,
		paddingTop: 6,
		paddingBottom: 2,
	},
})

type Props = {
	header?: false | string,
	footer?: false | string,
	children?: any,
	style?: any,
}

export function Card({header, footer, children, style}: Props) {
	return (
		<View style={[cardStyles.card, style]}>
			{header ? (
				<View style={cardStyles.title}>
					<Text selectable={true} style={cardStyles.titleText}>
						{header}
					</Text>
				</View>
			) : null}

			<View>{children}</View>

			{footer ? (
				<View style={cardStyles.footer}>
					<Text selectable={true} style={cardStyles.footerText}>
						{footer}
					</Text>
				</View>
			) : null}
		</View>
	)
}
