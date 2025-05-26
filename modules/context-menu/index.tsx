import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import {ContextMenuButton, MenuState} from 'react-native-ios-context-menu'
import {upperFirst} from 'lodash'

interface ContextMenuProps {
	actions: string[]
	buttonStyle?: StyleProp<ViewStyle>
	children?: React.ReactElement
	disabled?: boolean
	isMenuPrimaryAction?: boolean
	onPress?: () => void
	onPressMenuItem: (menuKey: string) => void | Promise<void>
	selectedAction?: string
	title: string
}

export const ContextMenu = React.forwardRef<
	ContextMenuButton,
	ContextMenuProps
>((props, ref): JSX.Element => {
	const {
		actions,
		buttonStyle,
		children,
		disabled,
		isMenuPrimaryAction,
		onPress,
		onPressMenuItem,
		selectedAction,
		title,
	} = props

	let menuItems = React.useMemo(() => {
		return actions.map((option) => {
			const menuState: MenuState = selectedAction === option ? 'on' : 'off'
			return {
				actionKey: option,
				actionTitle: upperFirst(option),
				menuState,
			}
		})
	}, [actions, selectedAction])

	return (
		<ContextMenuButton
			ref={ref}
			enableContextMenu={!disabled}
			isMenuPrimaryAction={isMenuPrimaryAction ?? false}
			menuConfig={{
				menuTitle: title ?? '',
				menuItems,
			}}
			onPressMenuItem={({nativeEvent}) => {
				onPressMenuItem(nativeEvent.actionKey)
			}}
			style={buttonStyle}
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
