import {decode} from '@frogpond/html-lib'

import type {MasterCorIconMapType, MenuItemType} from '../types'

/**
 * What VoiceOver reads for a row.
 *
 * The dietary icons are images with no text alternative, so without this the
 * only place the list states an item is vegan or gluten-free is invisible to
 * anyone not looking at it. The specials star has the same problem.
 */
export function foodRowLabel(
	item: MenuItemType,
	corIcons: MasterCorIconMapType,
	iconKeys: string[],
): string {
	let parts = [item.label]

	if (item.special) {
		parts.push('Special')
	}

	for (let key of iconKeys) {
		let label = corIcons[key]?.label
		if (label) {
			parts.push(decode(label))
		}
	}

	return parts.join(', ')
}
