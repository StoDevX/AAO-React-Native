import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import {
	ContextMenuButton,
	type MenuElementConfig,
} from 'react-native-ios-context-menu'
import {upperFirst} from 'lodash'

interface ContextMenuProps {
	actions: (string | MenuElementConfig)[]
	buttonStyle?: StyleProp<ViewStyle>
	children?: React.ReactElement
	disabled?: boolean
	isMenuPrimaryAction?: boolean
	onPress?: () => void
	onPressMenuItem: (actionKey: string) => void | Promise<void>
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
		title,
	} = props

	let menuItems = React.useMemo(() => {
		return actions.map((option) =>
			typeof option === 'string'
				? {actionKey: option, actionTitle: upperFirst(option)}
				: option,
		)
	}, [actions])

	return (
		<ContextMenuButton
			ref={ref}
			enableContextMenu={!disabled ?? false}
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
