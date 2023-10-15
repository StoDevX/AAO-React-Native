import React from 'react'
import {Platform, Text, StyleSheet, TextProps} from 'react-native'
import {SelectableText} from './selectable'
import {iOSUIKit, material} from 'react-native-typography'
import * as c from '@frogpond/colors'

const styles = StyleSheet.create({
	text: {
		...Platform.select({
			ios: iOSUIKit.bodyObject,
			android: material.body1Object,
		}),
		color: c.label,
	},
	strong: {
		fontWeight: 'bold',
	},
	emph: {
		fontStyle: 'italic',
	},
	paragraph: {
		marginVertical: 3,
		paddingRight: 4,
		...Platform.select({
			ios: iOSUIKit.bodyObject,
			android: material.body1Object,
		}),
		color: c.label,
	},
	blockQuote: {
		marginHorizontal: 8,
		marginVertical: 5,
		fontStyle: 'italic',
		...Platform.select({
			ios: iOSUIKit.calloutObject,
			android: material.captionObject,
		}),
	},
})

export const BaseText = (props: TextProps): JSX.Element => (
	<Text {...props} style={[styles.text, props.style]} />
)

export const Paragraph = (
	props: Parameters<typeof SelectableText>[0],
): JSX.Element => (
	<SelectableText {...props} style={[styles.paragraph, props.style]} />
)

export const BlockQuote = (
	props: Parameters<typeof Paragraph>[0],
): JSX.Element => (
	<Paragraph {...props} style={[styles.blockQuote, props.style]} />
)

export const Strong = (props: TextProps): JSX.Element => (
	<Text {...props} style={[styles.strong, props.style]} />
)

export const Emph = (props: TextProps): JSX.Element => (
	<Text {...props} style={[styles.emph, props.style]} />
)
