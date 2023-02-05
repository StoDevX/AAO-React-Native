import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import {ContextMenuButton} from 'react-native-ios-context-menu'
import {upperFirst} from 'lodash'

interface ContextMenuProps {
	accessibilityLabel?: string
	actions: string[]
	buttonStyle?: StyleProp<ViewStyle>
	children?: React.ReactElement
	disabled?: boolean
	isMenuPrimaryAction?: boolean
	onPress?: () => void
	onPressMenuItem: (menuKey: string) => void | Promise<void>
	testId?: string
	title: string
}

export const ContextMenu = React.forwardRef<
	ContextMenuButton,
	ContextMenuProps
>((props, ref): JSX.Element => {
	const {
		accessibilityLabel,
		actions,
		buttonStyle,
		children,
		disabled,
		isMenuPrimaryAction,
		onPress,
		onPressMenuItem,
		testId,
		title,
	} = props

	let menuItems = React.useMemo(() => {
		return actions.map((option) => ({
			actionKey: option,
			actionTitle: upperFirst(option),
		}))
	}, [actions])

	return (
		<ContextMenuButton
			ref={ref}
			accessibilityLabel={accessibilityLabel}
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
			testID={testId}
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
