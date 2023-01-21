import * as React from 'react'
import {
	Platform,
	StyleProp,
	StyleSheet,
	TextProps,
	TextStyle,
} from 'react-native'
import {SelectableText} from './selectable'
import {iOSUIKit, material} from 'react-native-typography'

const styles = StyleSheet.create({
	header: {
		marginTop: 8,
		marginBottom: 4,
	},
	h1: {
		...Platform.select({
			ios: iOSUIKit.title3EmphasizedObject,
			android: material.headlineObject,
		}),
	},
	h2: {
		...Platform.select({
			ios: iOSUIKit.title3Object,
			android: material.titleObject,
		}),
	},
	h3: {
		...Platform.select({
			ios: iOSUIKit.subheadEmphasizedObject,
			android: material.subheadingObject,
		}),
	},
	h4: {
		...Platform.select({
			ios: iOSUIKit.subheadObject,
			android: material.buttonObject,
		}),
	},
})

export const Header = (props: TextProps): JSX.Element => (
	<SelectableText {...props} style={[styles.header, props.style]} />
)

export const Heading = (
	props: React.PropsWithChildren<{level: number; style: StyleProp<TextStyle>}>,
): JSX.Element => {
	switch (props.level) {
		case 1:
			return <Header style={[styles.h1, props.style]}>{props.children}</Header>
		case 2:
			return <Header style={[styles.h2, props.style]}>{props.children}</Header>
		case 3:
			return <Header style={[styles.h3, props.style]}>{props.children}</Header>
		case 4:
		case 5:
		case 6:
		default:
			return <Header style={[styles.h4, props.style]}>{props.children}</Header>
	}
}
