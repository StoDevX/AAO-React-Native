import * as React from 'react'
import {useRef, useState} from 'react'
import {
	Platform,
	StyleProp,
	StyleSheet,
	Text,
	TextStyle,
	View,
	ViewStyle,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import type {FilterType} from './types'
import {FilterPopover} from './filter-popover'
import * as c from '@frogpond/colors'
import {Touchable} from '@frogpond/touchable'
import {useTheme} from '@frogpond/app-theme'

const buttonStyles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 10,
		paddingHorizontal: 8,
		paddingVertical: 5,
		borderWidth: 1,
		borderRadius: 2,
	},
	inactiveButton: {
		borderColor: c.iosDisabledText,
	},
	inactiveText: {
		color: c.iosDisabledText,
	},
	text: {
		fontSize: 16,
	},
	textWithIcon: {
		paddingRight: 8,
	},
})

type Props<T extends object> = {
	filter: FilterType<T>
	isActive: boolean
	onPopoverDismiss: (filter: FilterType<T>) => unknown
	style?: StyleProp<ViewStyle>
	title: string
}

export function FilterToolbarButton<T extends object>(
	props: Props<T>,
): JSX.Element | null {
	let {onPopoverDismiss, filter, isActive, style, title} = props

	let theme = useTheme()
	let [popoverVisible, setPopoverVisible] = useState(false)
	let touchable = useRef<View>(null)

	let openPopover = (): void => {
		setPopoverVisible(true)
	}

	let onClosePopover = (filter: FilterType<T>): void => {
		onPopoverDismiss(filter)
		setPopoverVisible(false)
	}

	let icon = Platform.select({
		ios: 'ios-chevron-down',
		android: 'md-chevron-down',
		default: '',
	})

	let activeButton = {
		backgroundColor: theme.toolbarButtonBackground,
		borderColor: theme.toolbarButtonBackground,
	}

	let inactiveText = {
		color: theme.toolbarButtonForeground,
	}

	let activeButtonStyle = isActive ? activeButton : buttonStyles.inactiveButton
	let activeContentStyle = isActive ? inactiveText : buttonStyles.inactiveText

	let textWithIconStyle = icon ? buttonStyles.textWithIcon : null
	let activeTextStyle: TextStyle = {
		fontWeight: isActive && Platform.OS === 'android' ? 'bold' : 'normal',
	}

	if (filter.type === 'list') {
		if (!filter.spec.options.length) {
			return null
		}
	}

	let buttonTextStyle = [
		activeContentStyle,
		textWithIconStyle,
		activeTextStyle,
		buttonStyles.text,
	]

	return (
		<React.Fragment>
			<Touchable
				ref={touchable}
				highlight={false}
				onPress={openPopover}
				style={[buttonStyles.button, activeButtonStyle, style]}
			>
				<Text style={buttonTextStyle}>{title}</Text>
				<Icon name={icon} size={18} style={activeContentStyle} />
			</Touchable>
			{popoverVisible && (
				<FilterPopover<T>
					anchor={touchable}
					filter={filter}
					onClosePopover={onClosePopover}
					visible={true}
				/>
			)}
		</React.Fragment>
	)
}
