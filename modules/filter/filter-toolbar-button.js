// @flow
import * as React from 'react'
import {StyleSheet, Text, Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import type {FilterType} from './types'
import {FilterPopover} from './filter-popover'
import * as c from '@frogpond/colors'
import {Touchable} from '@frogpond/touchable'
import {type AppTheme} from '@frogpond/app-theme'
import {withTheme} from '@callstack/react-theme-provider'

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
	theme: AppTheme,
}

type State = {
	popoverVisible: boolean,
}

class FilterToolbarButton extends React.PureComponent<Props, State> {
	state = {
		popoverVisible: false,
	}

	touchable: React.Ref<*> = React.createRef()

	openPopover = () => {
		this.setState(() => ({popoverVisible: true}))
	}

	onClosePopover = (filter: FilterType) => {
		this.props.onPopoverDismiss(filter)
		this.setState(() => ({popoverVisible: false}))
	}

	render() {
		const {filter, isActive, style, title, theme} = this.props
		const {popoverVisible} = this.state
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

		let activeButtonStyle = isActive
			? activeButton
			: buttonStyles.inactiveButton
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
			<React.Fragment>
				<Touchable
					ref={this.touchable}
					highlight={false}
					onPress={this.openPopover}
					style={[buttonStyles.button, activeButtonStyle, style]}
				>
					<Text style={buttonTextStyle}>{title}</Text>
					<Icon name={icon} size={18} style={activeContentStyle} />
				</Touchable>
				<FilterPopover
					anchor={this.touchable}
					filter={filter}
					onClosePopover={this.onClosePopover}
					visible={popoverVisible}
				/>
			</React.Fragment>
		)
	}
}

export const RawFilterToolbarButton = FilterToolbarButton

const ThemedFilterToolbarButton = withTheme(FilterToolbarButton)

export {ThemedFilterToolbarButton as FilterToolbarButton}
