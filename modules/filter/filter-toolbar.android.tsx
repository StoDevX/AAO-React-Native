import * as React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {FilterChip, Host, Icon, Text} from '@expo/ui/jetpack-compose'
import {Toolbar} from '@frogpond/toolbar'
import {isEqual} from '@frogpond/collections'

import {symbolSource} from '../../source/android-ui/components/symbol'
import {FilterToolbarButton} from './filter-toolbar-button'
import {filterShape} from './lib/filter-shape'
import {optionLabel} from './lib/option-label'
import {toggleOption} from './lib/select-options'
import type {Filter, ListFilter, ListFilterOption, ToggleFilter} from './types'

type Props<T extends object> = {
	filters: Array<Filter<T>>
	onChange: (filter: Filter<T>) => unknown
}

/** Material 3's filter chip icon size. */
const CHIP_ICON_SIZE = 18

/**
 * The filter row on Android, as Material draws one: a horizontally scrolling
 * row of filter chips.
 *
 * A toggle filter is one chip, selected while it narrows. A toolbar that
 * carries nothing but one short list -- Streaming Media's categories -- lays
 * that list's options out as chips of their own, the way Android apps filter
 * a feed, rather than hiding them behind a pull-down. Any other filter keeps
 * the menu or sheet `FilterToolbarButton` gives it, in the same row.
 */
export function FilterToolbar<T extends object>({filters, onChange}: Props<T>): React.ReactNode {
	let inlineList = loneMenuList(filters)

	let chips = inlineList
		? inlineList.spec.options.map((option) => (
				<OptionChip key={option.title} filter={inlineList} onChange={onChange} option={option} />
			))
		: filters.map((filter) =>
				filter.type === 'toggle' ? (
					<ToggleChip key={filter.spec.title} filter={filter} onChange={onChange} />
				) : (
					<FilterToolbarButton<T>
						key={filter.spec.title}
						filter={filter}
						isActive={filter.enabled}
						onChange={onChange}
						title={filter.spec.title}
					/>
				),
			)

	return (
		<Toolbar>
			<ScrollView
				contentContainerStyle={styles.scroller}
				horizontal={true}
				showsHorizontalScrollIndicator={false}
			>
				{chips}
			</ScrollView>
		</Toolbar>
	)
}

/** The toolbar's one filter, when it is a list short enough for a menu; otherwise null. */
function loneMenuList<T extends object>(filters: Array<Filter<T>>): ListFilter<T> | null {
	let [only] = filters
	if (filters.length !== 1 || only?.type !== 'list' || filterShape(only) !== 'menu') {
		return null
	}
	return only
}

function Chip({
	label,
	selected,
	disabled,
	onClick,
}: {
	label: string
	selected: boolean
	disabled?: boolean
	onClick: () => void
}): React.ReactNode {
	return (
		<Host matchContents={true}>
			<FilterChip enabled={!disabled} onClick={onClick} selected={selected}>
				<FilterChip.Label>
					<Text>{label}</Text>
				</FilterChip.Label>
				{selected ? (
					<FilterChip.LeadingIcon>
						<Icon size={CHIP_ICON_SIZE} source={symbolSource('checkmark')} />
					</FilterChip.LeadingIcon>
				) : null}
			</FilterChip>
		</Host>
	)
}

function ToggleChip<T extends object>({
	filter,
	onChange,
}: {
	filter: ToggleFilter<T>
	onChange: (filter: Filter<T>) => unknown
}): React.ReactNode {
	return (
		<Chip
			disabled={filter.disabled}
			label={filter.spec.title}
			onClick={() => onChange({...filter, enabled: !filter.enabled})}
			selected={filter.enabled}
		/>
	)
}

function OptionChip<T extends object>({
	filter,
	option,
	onChange,
}: {
	filter: ListFilter<T>
	option: ListFilterOption
	onChange: (filter: Filter<T>) => unknown
}): React.ReactNode {
	return (
		<Chip
			disabled={filter.disabled}
			label={optionLabel(option, filter.spec.displayTitle)}
			onClick={() => onChange(toggleOption(filter, option))}
			selected={filter.spec.selected.some((selected) => isEqual(selected, option))}
		/>
	)
}

const styles = StyleSheet.create({
	scroller: {
		// Material's chip row: 16dp from the screen edge, 8dp between chips.
		paddingHorizontal: 16,
		paddingVertical: 8,
		columnGap: 8,
		alignItems: 'center',
	},
})
