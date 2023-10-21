import * as React from 'react'
import {StyleSheet, Text, TextProps} from 'react-native'

import * as c from '@frogpond/colors'
import {openUrl} from '@frogpond/open-url'

import {useActionSheet} from '@expo/react-native-action-sheet'
import Clipboard from '@react-native-clipboard/clipboard'

const styles = StyleSheet.create({
	linkText: {
		textDecorationLine: 'underline',
		textDecorationStyle: 'solid',
		color: c.link,
	},
})

export const LinkText = (props: TextProps): JSX.Element => (
	<Text {...props} style={[styles.linkText, props.style]} />
)

type Props = Parameters<typeof LinkText>[0] & {
	href: string
	title?: string
}

type Callback = ({title, href}: {title?: string; href: string}) => void

const LINK_OPTIONS: Array<{name: string; action: Callback}> = [
	{
		name: 'Open',
		action: ({href}: {href: string}) => openUrl(href),
	},
	{
		name: 'Copy',
		action: ({title, href}: {href: string; title?: string}) =>
			Clipboard.setString(`${href}${title ? ' ' + title : ''}`),
	},
	{
		name: 'Cancel',
		action: () => {
			/* do nothing */
		},
	},
]

export function Link(props: Props): JSX.Element {
	let {showActionSheetWithOptions} = useActionSheet()

	const onPress = React.useCallback(() => {
		return openUrl(props.href)
	}, [props.href])

	const onLongPressEnd = React.useCallback(
		(pressedOptionIndex?: number) => {
			if (pressedOptionIndex === undefined) {
				return
			}
			LINK_OPTIONS[pressedOptionIndex].action({
				title: props.title,
				href: props.href,
			})
		},
		[props.title, props.href],
	)

	const onLongPress = React.useCallback(() => {
		return showActionSheetWithOptions(
			{
				options: LINK_OPTIONS.map(({name}) => name),
				title: props.title,
				message: props.href,
				cancelButtonIndex: LINK_OPTIONS.length - 1,
			},
			onLongPressEnd,
		)
	}, [showActionSheetWithOptions, props.title, props.href, onLongPressEnd])

	return (
		<LinkText onLongPress={onLongPress} onPress={onPress}>
			{props.children}
		</LinkText>
	)
}
