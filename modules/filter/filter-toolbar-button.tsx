import * as React from 'react'
import {useState} from 'react'
import {StyleProp, StyleSheet, Text, ViewStyle} from 'react-native'
import {SymbolView} from 'expo-symbols'
import type {FilterIcon, FilterType, ListItemSpecType} from './types'
import {FilterMenu} from './filter-menu'
import {FilterSheet} from './filter-sheet'
import {filterShape} from './lib/filter-shape'
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
	activeButton: {
		backgroundColor: c.link,
		borderColor: c.link,
	},
	text: {
		color: c.label,
		fontSize: 16,
	},
	activeText: {
		color: c.white,
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
	/// Forwarded to the sheet only -- a pull-down menu is text-only, so a
	/// `menu`-shaped filter never draws icons regardless of what this returns.
	iconFor?: (option: ListItemSpecType) => FilterIcon | null
}

/**
 * Picks a filter's presentation and renders it. A `Menu` is its own trigger --
 * its `label` prop draws the button -- so this component renders nothing else
 * for that shape. A sheet has no such trigger built in, so this component
 * renders the same button the popover used to open behind, and owns the
 * presentation state that opens the sheet under it.
 */
export function FilterToolbarButton<T extends object>(props: Props<T>): React.ReactNode {
	let {onPopoverDismiss, filter, isActive, style, title, iconFor} = props

	let [isPresented, setIsPresented] = useState(false)

	let shape = filterShape(filter)

	if (shape === 'none') {
		return null
	}

	if (shape === 'menu') {
		return <FilterMenu filter={filter} onChange={onPopoverDismiss} />
	}

	// `filterShape` only returns 'sheet' for a `list` filter, so this always
	// narrows successfully; the `false` branch never renders in practice.
	if (filter.type !== 'list') {
		return null
	}

	return (
		<React.Fragment>
			<Touchable
				accessibilityLabel={title}
				accessibilityRole="button"
				accessibilityState={{selected: isActive}}
				highlight={false}
				onPress={() => setIsPresented(true)}
				style={[buttonStyles.button, isActive && buttonStyles.activeButton, style]}
			>
				<Text
					style={[
						buttonStyles.text,
						buttonStyles.textWithIcon,
						isActive && buttonStyles.activeText,
					]}
				>
					{title}
				</Text>
				<SymbolView name="chevron.down" size={18} tintColor={isActive ? c.white : c.label} />
			</Touchable>
			<FilterSheet
				filter={filter}
				iconFor={iconFor}
				isPresented={isPresented}
				onChange={onPopoverDismiss}
				onDismiss={() => setIsPresented(false)}
			/>
		</React.Fragment>
	)
}
