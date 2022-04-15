import * as React from 'react'
import {Clipboard} from 'react-native'
import glamorous from 'glamorous-native'
import {openUrl} from '@frogpond/open-url'
import {connectActionSheet} from '@expo/react-native-action-sheet'

import * as c from '@frogpond/colors'

export const LinkText = glamorous.text({
	textDecorationLine: 'underline',
	textDecorationStyle: 'solid',
	color: c.infoBlue,
})

type Props = {
	href: string
	title?: string
	children: React.ReactChildren | JSX.Element
	showShareActionSheetWithOptions: any
	showActionSheetWithOptions: any
}

type Callback = ({title, href}: {title?: string; href: string}) => any

class Link extends React.PureComponent<Props> {
	options: Array<[string, Callback]> = [
		['Open', ({href}: {href: string}) => openUrl(href)],
		[
			'Copy',
			({title, href}: {href: string; title?: string}) =>
				Clipboard.setString(`${href}${title ? ' ' + title : ''}`),
		],
		[
			'Cancel',
			() => {
				/* do nothing */
			},
		],
	]

	onPress = () => {
		return openUrl(this.props.href)
	}

	onLongPress = () => {
		return this.props.showActionSheetWithOptions(
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
		const [_name, action] = this.options[pressedOptionIndex]
		return action(this.props)
	}

	onShareFailure = () => {
		/* do nothing */
	}
	onShareSuccess = () => {
		/* do nothing */
	}

	render() {
		return (
			<LinkText onLongPress={this.onLongPress} onPress={this.onPress}>
				{this.props.children}
			</LinkText>
		)
	}
}

const ConnectedLink = connectActionSheet(Link)

export {ConnectedLink as Link}
