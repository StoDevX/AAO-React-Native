import fuzzyfind from 'fuzzyfind'

import type {Building, Feature} from '../types'
import {LABEL_TO_CATEGORY, type CategoryLabel} from './categories'

/**
 * The places the picker lists.
 *
 * A query searches every category -- someone typing "skoglund" wants the
 * building whichever segment happens to be selected -- and matches a place's
 * nickname as well as its name, since the Caf and the Pause are what people
 * call them. With no query, the chosen segment is the whole of the answer.
 */
export function visibleBuildings(
	buildings: Array<Feature<Building>>,
	category: CategoryLabel,
	query: string,
): Array<Feature<Building>> {
	// fuzzyfind is subsequence-based and lowercases both sides itself, so the
	// needle arrives trimmed and otherwise untouched -- a leading space would
	// have to appear in the name before any of the typed letters.
	if (query) {
		return fuzzyfind(query, buildings, {
			accessor: (b: Feature<Building>) => `${b.properties.name} ${b.properties.nickname ?? ''}`,
		})
	}

	let key = LABEL_TO_CATEGORY[category]
	return buildings.filter((b) => b.properties.categories?.includes(key))
}
