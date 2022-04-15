import * as React from 'react'
import Clipboard from '@react-native-community/clipboard'
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

class Link extends React.PureComponent<Props> {
	onPress = () => {
		return openUrl(this.props.href)
	}

	onLongPress = () => {
		return this.props.showActionSheetWithOptions(
			{
				options: LINK_OPTIONS.map(({name}) => name),
				title: this.props.title,
				message: this.props.href,
				cancelButtonIndex: LINK_OPTIONS.length - 1,
			},
			this.onLongPressEnd,
		)
	}

	onLongPressEnd = (pressedOptionIndex: number) => {
		return LINK_OPTIONS[pressedOptionIndex].action(this.props)
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
