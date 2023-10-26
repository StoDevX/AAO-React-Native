import * as React from 'react'
import {Platform, StyleSheet} from 'react-native'

import {iOSUIKit, material} from 'react-native-typography'

import * as c from '@frogpond/colors'

import {SelectableText} from './selectable'

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
		color: c.label,
	},
	h2: {
		...Platform.select({
			ios: iOSUIKit.title3Object,
			android: material.titleObject,
		}),
		color: c.label,
	},
	h3: {
		...Platform.select({
			ios: iOSUIKit.subheadEmphasizedObject,
			android: material.subheadingObject,
		}),
		color: c.label,
	},
	h4: {
		...Platform.select({
			ios: iOSUIKit.subheadObject,
			android: material.buttonObject,
		}),
		color: c.label,
	},
})

export const Header = (
	props: Parameters<typeof SelectableText>[0],
): JSX.Element => (
	<SelectableText {...props} style={[styles.header, props.style]} />
)

export const Heading = ({
	level,
	...props
}: Parameters<typeof Header>[0] & {level: number}): JSX.Element => {
	switch (level) {
		case 1:
			return <Header {...props} style={[styles.h1, props.style]} />
		case 2:
			return <Header {...props} style={[styles.h2, props.style]} />
		case 3:
			return <Header {...props} style={[styles.h3, props.style]} />
		case 4:
		case 5:
		case 6:
		default:
			return <Header {...props} style={[styles.h4, props.style]} />
	}
}
