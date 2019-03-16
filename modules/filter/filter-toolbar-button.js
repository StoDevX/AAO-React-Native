// @flow
import * as React from 'react'
import {StyleSheet, Text, Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import type {FilterType} from './types'
import {FilterPopover} from './filter-popover'
import * as c from '@frogpond/colors'
import {Touchable} from '@frogpond/touchable'
import {useTheme} from '@frogpond/theme'

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

type Props = {
	filter: FilterType,
	isActive: boolean,
	onPopoverDismiss: (filter: FilterType) => any,
	style?: any,
	title: string,
}

export function FilterToolbarButton(props: Props) {
	const {filter, isActive, style, title} = props
	let theme = useTheme()
	let [popoverVisible, setPopoverVisible] = React.useState(false)

	let touchable: React.Ref<*> = React.useRef(null)

	let openPopover = () => {
		setPopoverVisible(false)
	}

	let onClosePopover = (filter: FilterType) => {
		props.onPopoverDismiss(filter)
		setPopoverVisible(false)
	}

	const icon = Platform.select({
		ios: 'ios-arrow-down',
		android: 'md-arrow-dropdown',
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
	let activeTextStyle = {
		fontWeight: isActive && Platform.OS === 'android' ? 'bold' : 'normal',
	}

	if (filter.type === 'list') {
		if (!filter.spec.options.length) {
			return null
		}
	}

	const buttonTextStyle = [
		activeContentStyle,
		textWithIconStyle,
		activeTextStyle,
		buttonStyles.text,
	]

	return (
		<>
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
				<FilterPopover
					anchor={touchable}
					filter={filter}
					onClosePopover={onClosePopover}
					visible={true}
				/>
			)}
		</>
	)
}
