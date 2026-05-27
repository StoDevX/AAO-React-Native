import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import {
	ContextMenuButton,
	MenuState,
	OnPressMenuItemEvent,
} from 'react-native-ios-context-menu'
import type {IconConfig} from 'react-native-ios-context-menu/src/types/MenuIconConfig'
import {upperFirst} from 'lodash'

export type ContextMenuAction = {
	key: string
	title?: string
	icon?: IconConfig
}

interface ContextMenuProps {
	actions: Array<string | ContextMenuAction>
	buttonStyle?: StyleProp<ViewStyle>
	children?: React.ReactElement
	disabled?: boolean
	isMenuPrimaryAction?: boolean
	onPress?: () => void
	onPressMenuItem: (menuKey: string) => void | Promise<void>
	selectedAction?: string
	testID?: string
	title: string
}

export const ContextMenu = React.forwardRef<
	ContextMenuButton,
	ContextMenuProps
>((props, ref): React.ReactElement => {
	const {
		actions,
		buttonStyle,
		children,
		disabled,
		isMenuPrimaryAction,
		onPress,
		onPressMenuItem,
		selectedAction,
		testID,
		title,
	} = props

	let menuItems = React.useMemo(() => {
		return actions.map((action) => {
			const key = typeof action === 'string' ? action : action.key
			const label =
				typeof action === 'string'
					? upperFirst(action)
					: (action.title ?? upperFirst(action.key))
			const icon = typeof action === 'string' ? undefined : action.icon
			const menuState: MenuState = selectedAction === key ? 'on' : 'off'
			return {
				actionKey: key,
				actionTitle: label,
				menuState,
				...(icon ? {icon} : {}),
			}
		})
	}, [actions, selectedAction])

	return (
		<ContextMenuButton
			ref={ref}
			isContextMenuEnabled={!disabled}
			isMenuPrimaryAction={isMenuPrimaryAction ?? false}
			menuConfig={{
				menuTitle: title ?? '',
				menuItems,
			}}
			onPressMenuItem={({nativeEvent}: Parameters<OnPressMenuItemEvent>[0]) => {
				onPressMenuItem(nativeEvent.actionKey)
			}}
			style={buttonStyle}
			testID={testID}
		>
			{onPress ? (
				<Touchable highlight={false} onPress={onPress}>
					{children}
				</Touchable>
			) : (
				children
			)}
		</ContextMenuButton>
	)
})
