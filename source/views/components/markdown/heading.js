// @flow

import * as React from 'react'
import {Platform} from 'react-native'
import glamorous from 'glamorous-native'
import {SelectableText} from './selectable'
import {iOSUIKit, material} from 'react-native-typography'

export const Header = glamorous(SelectableText)({
	marginTop: 8,
	marginBottom: 4,
})

const h1 = {
	...Platform.select({
		ios: iOSUIKit.title3EmphasizedObject,
		android: material.headlineObject,
	}),
}

const h2 = {
	...Platform.select({
		ios: iOSUIKit.title3Object,
		android: material.titleObject,
	}),
}

const h3 = {
	...Platform.select({
		ios: iOSUIKit.subheadEmphasizedObject,
		android: material.subheadingObject,
	}),
}

const h4 = {
	...Platform.select({
		ios: iOSUIKit.subheadObject,
		android: material.buttonObject,
	}),
}

export const Heading = (props: any) => {
	switch (props.level) {
		case 1:
			return <Header style={h1}>{props.children}</Header>
		case 2:
			return <Header style={h2}>{props.children}</Header>
		case 3:
			return <Header style={h3}>{props.children}</Header>
		case 4:
		case 5:
		case 6:
		default:
			return <Header style={h4}>{props.children}</Header>
	}
}
