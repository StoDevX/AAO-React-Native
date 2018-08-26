// @flow

import * as React from 'react'
import {ActionSheetIOS, Clipboard} from 'react-native'
import glamorous from 'glamorous-native'
import openUrl from '../open-url'

import * as c from '../colors'

export const LinkText = glamorous.text({
	textDecorationLine: 'underline',
	textDecorationStyle: 'solid',
	color: c.infoBlue,
})

type Props = {
	href: string,
	title?: string,
	children: React.ChildrenArray<string>,
}

type Callback = ({title?: string, href: string}) => any

export class Link extends React.PureComponent<Props> {
	options: Array<[string, Callback]> = [
		['Open', ({href}: {href: string}) => openUrl(href)],
		[
			'Copy',
			({title, href}: {href: string, title?: string}) =>
				Clipboard.setString(`${href}${title ? ' ' + title : ''}`),
		],
		[
			'Share…',
			({href}: {href: string}) =>
				ActionSheetIOS.showShareActionSheetWithOptions(
					{url: href},
					this.onShareFailure,
					this.onShareSuccess,
				),
		],
		['Cancel', () => {}],
	]

	onPress = () => {
		return openUrl(this.props.href)
	}

	onLongPress = () => {
		return ActionSheetIOS.showActionSheetWithOptions(
			{
				options: this.options.map(([name]) => name),
				title: this.props.title,
				message: this.props.href,
				cancelButtonIndex: this.options.length - 1,
			},
			this.onLongPressEnd,
		)
	}

	onLongPressEnd = (pressedOptionIndex: number) => {
		// eslint-disable-next-line no-unused-vars
		const [name, action] = this.options[pressedOptionIndex]
		return action(this.props)
	}

	onShareFailure = () => {}
	onShareSuccess = () => {}

	render() {
		return (
			<LinkText onLongPress={this.onLongPress} onPress={this.onPress}>
				{this.props.children}
			</LinkText>
		)
	}
}
