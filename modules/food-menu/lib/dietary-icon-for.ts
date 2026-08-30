import type {FilterIcon, ListItemSpecType} from '@frogpond/filter'
import {decode} from '@frogpond/html-lib'

import type {MasterCorIconMapType} from '../types'

/**
 * Builds the Dietary Restrictions filter's `iconFor` lookup. `build-filters.ts`
 * gives each option a `title` of `decode(cor.label)`, while `useLocalCorIcons`
 * keys its downloads by cor-icon key -- so this bridges label back to key
 * before it can hand back a drawable icon. The filter package never learns
 * any of this; it only ever sees the function this returns.
 */
export function dietaryIconFor(
	corIcons: MasterCorIconMapType,
	localIcons: Record<string, string>,
): (option: ListItemSpecType) => FilterIcon | null {
	let keyByLabel = new Map(Object.entries(corIcons).map(([key, icon]) => [decode(icon.label), key]))

	return (option) => {
		let key = keyByLabel.get(option.title)
		let uri = key ? localIcons[key] : undefined
		return uri ? {kind: 'localFile', uri} : null
	}
}
