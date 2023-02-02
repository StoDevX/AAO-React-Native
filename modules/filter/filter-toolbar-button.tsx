import * as React from 'react'
import {useRef, useState} from 'react'
import {
	Platform,
	StyleProp,
	StyleSheet,
	Text,
	View,
	ViewStyle,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import type {Filter} from './types'
import {FilterPopover} from './filter-popover'
import * as c from '@frogpond/colors'
import {Touchable} from '@frogpond/touchable'
import {ContextMenu} from '@frogpond/context-menu'
import {MenuElementConfig} from 'react-native-ios-context-menu'

const buttonStyles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 10,
		paddingHorizontal: 8,
		paddingVertical: 5,
		borderWidth: 1,
		borderRadius: 2,
		backgroundColor: c.systemGroupedBackground,
		borderColor: c.separator,
	},
	text: {
		color: c.label,
		fontSize: 16,
	},
	textWithIcon: {
		paddingRight: 8,
	},
})

const ICON_NAME = Platform.select({
	ios: 'ios-chevron-down',
	android: 'md-chevron-down',
	default: '',
})

type Props<T extends object> = {
	filter: Filter<T>
	isActive: boolean
	onPopoverDismiss: (filter: Filter<T>) => unknown
	style?: StyleProp<ViewStyle>
	title: string
}

export function FilterToolbarButton<T extends object>(
	props: Props<T>,
): JSX.Element | null {
	let {onPopoverDismiss, filter, style, title} = props

	let onClosePopover = (): void => {
		onPopoverDismiss(props.filter)
	}

	if (filter.type === 'list') {
		if (!filter.spec.options.length) {
			return null
		}
	}

	let actions: MenuElementConfig[] =
		filter.type === 'toggle'
			? [{actionKey: 'enabled', actionTitle: 'Enabled'}]
			: filter.type === 'picker'
			? filter.spec.options.map((o) => ({
					actionKey: o.label,
					actionTitle: o.label,
			  }))
			: filter.type === 'list'
			? filter.spec.options.map((o) => ({
					actionKey: o.title,
					actionTitle: o.title,
					actionSubtitle: o.detail?.startsWith(o.title) ? o.detail.substring(o.title.length + 2) : o.detail,
					icon: o.image && typeof o.image ===  'object' && !Array.isArray(o.image) ? {
						type: 'IMAGE_REMOTE_URL',
						imageValue: {
							url: o.image.uri,
							shouldCache: true,
						},
					} : null,
			  }))
			: []

	return (
		<ContextMenu
			actions={actions}
			disabled={false}
			isMenuPrimaryAction={true}
			onPressMenuItem={onClosePopover}
			title={filter.spec.title}
		>
			<View style={[buttonStyles.button, style]}>
				<Text
					style={[
						buttonStyles.text,
						ICON_NAME ? buttonStyles.textWithIcon : null,
					]}
				>
					{title}
				</Text>
				<Icon name={ICON_NAME} size={18} style={buttonStyles.text} />
			</View>
		</ContextMenu>
	)
}
