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
import Ionicon from '@expo/vector-icons/Ionicons'
import type {FilterType} from './types'
import {FilterPopover} from './filter-popover'
import * as c from '../colors'
import {Touchable} from '../touchable'

type IoniconName = keyof typeof Ionicon.glyphMap

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

const ICON_NAME: IoniconName = Platform.select({
	ios: 'chevron-down' satisfies IoniconName,
	android: 'chevron-down' satisfies IoniconName,
	default: 'chevron-down' satisfies IoniconName,
})

interface Props<T extends object> {
	filter: FilterType<T>
	isActive: boolean
	onPopoverDismiss: (filter: FilterType<T>) => unknown
	style?: StyleProp<ViewStyle>
	title: string
}

export function FilterToolbarButton<T extends object>(
	props: Props<T>,
): React.JSX.Element | null {
	let {onPopoverDismiss, filter, style, title} = props

	let [popoverVisible, setPopoverVisible] = useState(false)
	let touchable = useRef<View>(null)

	let openPopover = (): void => {
		setPopoverVisible(true)
	}

	let onClosePopover = (updatedFilter: FilterType<T>): void => {
		onPopoverDismiss(updatedFilter)
		setPopoverVisible(false)
	}

	if (filter.type === 'list') {
		if (!filter.spec.options.length) {
			return null
		}
	}

	return (
		<React.Fragment>
			<Touchable
				ref={touchable}
				highlight={false}
				onPress={openPopover}
				style={[buttonStyles.button, style]}
			>
				<Text style={[buttonStyles.text, buttonStyles.textWithIcon]}>
					{title}
				</Text>
				<Ionicon name={ICON_NAME} size={18} style={buttonStyles.text} />
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
