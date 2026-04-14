import * as React from 'react'
import {useRef, useState} from 'react'
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native'
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'
import type {FilterType} from './types'
import {FilterPopover} from './filter-popover'
import * as c from '@frogpond/colors'
import {Touchable} from '@frogpond/touchable'

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
				<Icon name="chevron-down" size={18} style={buttonStyles.text} />
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
