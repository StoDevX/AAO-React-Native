import React, {useCallback} from 'react'

import {
	Platform,
	StyleProp,
	StyleSheet,
	Text,
	View,
	ViewStyle,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import type {Filter, ListFilter, ToggleFilter} from './types'
import * as c from '@frogpond/colors'
import {ContextMenu} from '@frogpond/context-menu'
import {MenuElementConfig} from 'react-native-ios-context-menu'
import produce from 'immer'

class MissingActionKeyError extends Error {}

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

const ICON_NAME = Platform.select({
	ios: 'ios-chevron-down',
	android: 'md-chevron-down',
	default: '',
})

function updateFilter<T>(
	filter: ToggleFilter<T> | ListFilter<T>,
	actionKey?: string,
): ToggleFilter<T> | ListFilter<T> {
	if (filter.type === 'toggle') {
		return updateToggleFilter(filter)
	} else if (filter.type === 'list') {
		if (!actionKey) {
			throw new MissingActionKeyError()
		}
		return updateListFilter(filter, actionKey)
	} else {
		let unreachable: never = filter
		return unreachable
	}
}

function updateToggleFilter<T>(filter: ToggleFilter<T>): ToggleFilter<T> {
	return {...filter, active: !filter.active}
}

function updateListFilter<T>(
	filter: ListFilter<T>,
	actionKey: string,
): ListFilter<T> {
	return produce(filter, (filter) => {
		// if the actionKey is already in selectedIndices, remove it;
		// otherwise, add it.
		let indexOfActionKey = filter.options.findIndex(
			(opt) => opt.title === actionKey,
		)

		let selections = new Set(filter.selectedIndices)
		if (selections.has(indexOfActionKey)) {
			selections.delete(indexOfActionKey)
		} else {
			selections.add(indexOfActionKey)
		}

		filter.selectedIndices = [...selections].sort()

		return filter
	})
}

type Props<T> = {
	filter: Filter<T>
	isActive: boolean
	onChange: (updatedFilter: Filter<T>) => void
	style?: StyleProp<ViewStyle>
	title: string
}

export function FilterToolbarButton<T>(props: Props<T>): JSX.Element | null {
	let {onChange, filter, style, title} = props

	let handleSelection = useCallback(
		(actionKey: string) => onChange(updateFilter(filter, actionKey)),
		[onChange, filter],
	)

	if (filter.type === 'toggle') {
		return (
			<View style={[buttonStyles.button, style]}>
				<Icon name="checkmark" size={18} style={buttonStyles.text} />
				<Text style={[buttonStyles.text, buttonStyles.textWithIcon]}>
					{title}
				</Text>
				<Icon name={ICON_NAME} size={18} style={buttonStyles.text} />
			</View>
		)
	} else if (filter.type !== 'list') {
		let unreachable: never = filter
		return unreachable
	}

	if (!filter.options.length) {
		return null
	}

	let actions: MenuElementConfig[] = filter.options.map((o) => ({
		actionKey: o.title,
		actionTitle: o.title,
		actionSubtitle: o.subtitle,
		icon: o.image?.uri
			? {
					type: 'IMAGE_REMOTE_URL',
					imageValue: {url: o.image.uri, shouldCache: true},
			  }
			: undefined,
	}))

	return (
		<ContextMenu
			actions={actions}
			disabled={false}
			isMenuPrimaryAction={true}
			onPressMenuItem={handleSelection}
			title={filter.title}
		>
			<View style={[buttonStyles.button, style]}>
				<Text style={[buttonStyles.text, buttonStyles.textWithIcon]}>
					{title}
				</Text>
				<Icon name={ICON_NAME} size={18} style={buttonStyles.text} />
			</View>
		</ContextMenu>
	)
}
