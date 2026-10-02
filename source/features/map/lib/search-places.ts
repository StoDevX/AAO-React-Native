import fuzzyfind from 'fuzzyfind'

import type {Building, Feature} from '../types'

/**
 * The places a typed query finds. It searches every place -- someone typing
 * "skoglund" wants the building whichever group is open -- and matches a
 * place's nickname as well as its name, since the Caf and the Pause are what
 * people call them.
 */
export function searchPlaces(
	places: Array<Feature<Building>>,
	query: string,
): Array<Feature<Building>> {
	// fuzzyfind is subsequence-based and lowercases both sides itself, so the
	// needle arrives trimmed and otherwise untouched -- a leading space would
	// have to appear in the name before any of the typed letters.
	return fuzzyfind(query, places, {
		accessor: (b: Feature<Building>) => `${b.properties.name} ${b.properties.nickname ?? ''}`,
	})
}
