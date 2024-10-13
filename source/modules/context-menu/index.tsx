import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import {Touchable} from '../touchable'
import RNContextMenu, {
	type ContextMenuAction,
} from 'react-native-context-menu-view'
import {captureException} from '@sentry/react-native'

interface ContextMenuProps {
	actions: ContextMenuAction[]
	buttonStyle?: StyleProp<ViewStyle>
	children?: React.ReactElement
	disabled?: boolean
	dropdownMenuMode?: boolean
	onPress?: () => void
	onPressMenuItem: (menuKey: string) => void | Promise<void>
	title: string
}

export const ContextMenu = (props: ContextMenuProps): React.JSX.Element => {
	const {
		actions,
		buttonStyle,
		children,
		disabled,
		dropdownMenuMode,
		onPress,
		onPressMenuItem,
		title,
	} = props

	return (
		<RNContextMenu
			disabled={disabled ?? true}
			dropdownMenuMode={dropdownMenuMode ?? false}
			title={title}
			actions={actions}
			onPress={({nativeEvent}) => {
				Promise.resolve(onPressMenuItem(nativeEvent.name)).catch(
					(err: unknown) => captureException(err),
				)
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
		</RNContextMenu>
	)
}
