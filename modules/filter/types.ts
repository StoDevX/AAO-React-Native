import {ImageURISource} from 'react-native'
import type {ConditionalKeys} from 'type-fest'

/**
 * Configuration for a "list" filter's menu items.
 */
export type ListMenuItem = {
	title: string
	subtitle?: string
	image?: ImageURISource | null
}

/**
 * A "toggle" filter renders only a filter chip, with no menu, as there is
 * only one action.
 *
 * When enabled, any items which do not have `item[field]` set to `true` are
 * excluded from the list.
 */
export type ToggleFilter<T> = {
	/** The type of the filter */
	type: 'toggle'
	/** If the filter will be applied */
	active: boolean
	/** The field which the filter checks (must be a boolean) */
	field: ConditionalKeys<T, boolean | undefined>
	/** The title of the filter chip */
	title: string
}

/**
 * A "list" filter renders a filter chip which shows a menu when tapped.
 *
 * When enabled, if any menu items are selected, any list items which do not
 * contain (all|any) of those items are excluded from the list.
 */
export type ListFilter<T> = {
	/** The type of the filter */
	type: 'list'
	/** The field which the filter checks; must be a `string` or `string[]` */
	field: ConditionalKeys<T, string | number | string[] | number[] | undefined>
	/** The title of the filter chip */
	title: string
	/** The subtitle to show inside the menu */
	subtitle?: string
	/** The menu options */
	options: ListMenuItem[]
	/** The selected menu options */
	selectedIndices: number[]
	/** If "all", all of the selected indices must match; if "any", then only one must match */
	mode: 'all' | 'any'
}

export type Filter<T> = ToggleFilter<T> | ListFilter<T>
