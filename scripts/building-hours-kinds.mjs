// A building's card shows the one venue that is the building's own hours: its
// `kind: building` venue. Two such venues on one `building` key would leave
// the card to pick between them, so the data may not have them.

/**
 * The building keys with more than one `kind: building` venue, each with the
 * names of those venues, in the order given.
 *
 * @param {Array<{name: string, building?: string, kind: string}>} entries
 * @returns {Array<{building: string, names: string[]}>}
 */
export function duplicateBuildingHours(entries) {
	let byKey = new Map()
	for (let entry of entries) {
		if (entry.kind !== 'building' || !entry.building) {
			continue
		}
		let names = byKey.get(entry.building) ?? []
		names.push(entry.name)
		byKey.set(entry.building, names)
	}
	return [...byKey]
		.filter(([, names]) => names.length > 1)
		.map(([building, names]) => ({building, names}))
}
