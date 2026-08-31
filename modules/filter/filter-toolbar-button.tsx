import * as React from 'react'

import type {FilterIcon, FilterType, ListItemSpecType} from './types'
import {FilterMenu} from './filter-menu'
import {FilterSheet} from './filter-sheet'
import {FilterToggle} from './filter-toggle'
import {filterShape} from './lib/filter-shape'

type Props<T extends object> = {
	filter: FilterType<T>
	isActive: boolean
	onChange: (filter: FilterType<T>) => unknown
	title: string
	/// Forwarded to the sheet only -- a pull-down menu is text-only, so a
	/// `menu`-shaped filter never draws icons regardless of what this returns.
	iconFor?: (option: ListItemSpecType) => FilterIcon | null
}

/**
 * Picks a filter's presentation and renders it. Each one draws its own
 * trigger, styled identically (see `./lib/trigger-modifiers`): a `Menu`'s
 * `label` prop is its button, a sheet's `BottomSheet` anchors one, and a
 * toggle's trigger is the control itself. So this component only decides which
 * presentation a filter gets, and forwards what each one needs.
 */
export function FilterToolbarButton<T extends object>(props: Props<T>): React.ReactNode {
	let {onChange, filter, isActive, title, iconFor} = props

	let shape = filterShape(filter)

	if (shape === 'none') {
		return null
	}

	// `filterShape` only returns 'inline' for a `toggle` filter, so this always
	// narrows successfully; the `false` branch never renders in practice.
	if (shape === 'inline') {
		return filter.type === 'toggle' ? (
			<FilterToggle filter={filter} isActive={isActive} onChange={onChange} />
		) : null
	}

	if (shape === 'menu') {
		return <FilterMenu filter={filter} isActive={isActive} onChange={onChange} />
	}

	// `filterShape` only returns 'sheet' for a `list` filter, so this always
	// narrows successfully; the `false` branch never renders in practice.
	if (filter.type !== 'list') {
		return null
	}

	return (
		<FilterSheet
			filter={filter}
			iconFor={iconFor}
			isActive={isActive}
			onChange={onChange}
			title={title}
		/>
	)
}
