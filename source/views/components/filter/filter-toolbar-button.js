// @flow
import * as React from 'react'
import {StyleSheet, View, Text, Platform, TouchableOpacity} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import type {FilterType} from './types'
import {FilterPopover} from './filter-popover'
import * as c from '../colors'

const buttonStyles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 10,
		paddingHorizontal: 8,
		paddingVertical: 5,
		marginVertical: 8,
		borderWidth: 1,
		borderRadius: 2,
	},
	activeButton: {
		backgroundColor: c.toolbarButtonBackground,
		borderColor: c.toolbarButtonBackground,
	},
	inactiveButton: {
		borderColor: c.iosDisabledText,
	},
	activeText: {
		color: c.toolbarButtonForeground,
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
	iconName?: string,
	isActive: boolean,
	onPopoverDismiss: (filter: FilterType) => any,
	style?: any,
	title: string,
}

type State = {
	popoverVisible: boolean,
}

export class FilterToolbarButton extends React.PureComponent<Props, State> {
	touchable: TouchableOpacity

	state = {
		popoverVisible: false,
	}

	openPopover = () => {
		this.setState(() => ({popoverVisible: true}))
	}

	onClosePopover = (filter: FilterType) => {
		this.props.onPopoverDismiss(filter)
		this.setState(() => ({popoverVisible: false}))
	}

	render() {
		const {filter, iconName, isActive, style, title} = this.props
		const {popoverVisible} = this.state
		let icon
		if (!iconName) {
			icon = null
		} else if (Platform.OS === 'ios') {
			icon = iconName
		} else if (Platform.OS === 'android') {
			icon = iconName
		}

		let activeButtonStyle = isActive
			? buttonStyles.activeButton
			: buttonStyles.inactiveButton
		let activeContentStyle = isActive
			? buttonStyles.activeText
			: buttonStyles.inactiveText

		let textWithIconStyle = icon ? buttonStyles.textWithIcon : null
		let activeTextStyle = {
			fontWeight: isActive && Platform.OS === 'android' ? 'bold' : 'normal',
		}

		if (filter.type === 'list') {
			if (!filter.spec.options.length) {
				return null
			}
		}

		return (
			<View>
				<TouchableOpacity
					ref={ref => (this.touchable = ref)}
					onPress={this.openPopover}
					style={[buttonStyles.button, activeButtonStyle, style]}
				>
					<Text
						style={[
							activeContentStyle,
							textWithIconStyle,
							activeTextStyle,
							buttonStyles.text,
						]}
					>
						{title}
					</Text>
					{icon ? (
						<Icon name={icon} size={18} style={activeContentStyle} />
					) : null}
				</TouchableOpacity>
				<FilterPopover
					anchor={this.touchable}
					filter={filter}
					onClosePopover={this.onClosePopover}
					visible={popoverVisible}
				/>
			</View>
		)
	}
}
