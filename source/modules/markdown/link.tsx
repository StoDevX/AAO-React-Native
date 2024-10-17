import * as React from 'react'
import Clipboard from 'expo-clipboard'
import {openUrl} from '../open-url'
import {useActionSheet} from '@expo/react-native-action-sheet'
import * as c from '../colors'
import {TextProps, StyleSheet, Text} from 'react-native'
import {captureException} from '@sentry/react-native'

const styles = StyleSheet.create({
	linkText: {
		textDecorationLine: 'underline',
		textDecorationStyle: 'solid',
		color: c.link,
	},
})

export const LinkText = (props: TextProps): React.JSX.Element => (
	<Text {...props} style={[styles.linkText, props.style]} />
)

type Props = Parameters<typeof LinkText>[0] & {
	href: string
	title?: string
}

type Callback = ({title, href}: {title?: string; href: string}) => void

interface LinkOption {
	name: string
	action: Callback
}

const LINK_OPTIONS = [
	{
		name: 'Open',
		action: ({href}: {href: string}) => {
			openUrl(href).catch((error: unknown) => {
				captureException(error)
			})
		},
	} satisfies LinkOption,
	{
		name: 'Copy',
		action: ({title, href}: {href: string; title?: string}) => {
			Clipboard.setStringAsync(
				`${href}${title != null ? ' ' + title : ''}`,
			).catch((error: unknown) => {
				captureException(error)
			})
		},
	} satisfies LinkOption,
	{
		name: 'Cancel',
		action: () => {
			/* do nothing */
		},
	} satisfies LinkOption,
] as const satisfies LinkOption[]

export function Link(props: Props): React.JSX.Element {
	let {showActionSheetWithOptions} = useActionSheet()

	const onPress = React.useCallback(() => {
		openUrl(props.href).catch((error: unknown) => {
			captureException(error)
		})
	}, [props.href])

	const onLongPressEnd = React.useCallback(
		(pressedOptionIndex?: number) => {
			if (pressedOptionIndex === undefined) {
				return
			}
			LINK_OPTIONS[pressedOptionIndex]?.action({
				title: props.title,
				href: props.href,
			})
		},
		[props.title, props.href],
	)

	const onLongPress = React.useCallback(() => {
		showActionSheetWithOptions(
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
