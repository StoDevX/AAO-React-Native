import type {Building} from '../types'

/// One row of the card's Good to Know section, after Apple Maps' amenity rows.
export type GoodToKnowRow =
	| {kind: 'abbreviation'; text: string}
	| {kind: 'nickname'; text: string; others: Array<string>}
	| {kind: 'accessibility'; text: string; accessible: boolean}
	| {kind: 'length'; text: string}

const METRES_PER_MILE = 1609.344

/// A length as a person walking it thinks of it: tenths of a mile, and never
/// zero for a trail that is there.
export function formatMiles(metres: number): string {
	let miles = Math.max(0.1, Math.round((metres / METRES_PER_MILE) * 10) / 10)
	return `${miles.toFixed(1)} mi`
}

/// What the card has to say about a place beyond its name: its short code,
/// what people call it, how long it is if it is a trail, and whether a
/// wheelchair can get in. Nothing for a fact the feed does not know.
export function goodToKnowRows(
	building: Pick<Building, 'abbreviation' | 'nickname' | 'accessibility' | 'length'>,
): Array<GoodToKnowRow> {
	let rows: Array<GoodToKnowRow> = []
	let abbreviation = building.abbreviation?.trim() || null
	if (abbreviation) {
		rows.push({kind: 'abbreviation', text: `Abbreviated ${abbreviation}`})
	}

	// The feed is not validated at the boundary, so a record can omit it.
	let nickname = building.nickname ?? []
	let names = typeof nickname === 'string' ? [nickname] : nickname
	let nicknames = [...new Set(names.map((name) => name.trim()))].filter(
		(name) => name !== '' && name !== abbreviation,
	)
	let [first, ...others] = nicknames
	if (first) {
		rows.push({kind: 'nickname', text: first, others})
	}

	// A trail's length in metres, not a list's: checked as a number.
	if (typeof building.length === 'number' && building.length > 0) {
		rows.push({kind: 'length', text: formatMiles(building.length)})
	}

	if (building.accessibility === 'wheelchair') {
		rows.push({kind: 'accessibility', text: 'Wheelchair accessible', accessible: true})
	} else if (building.accessibility === 'none') {
		rows.push({kind: 'accessibility', text: 'Not wheelchair accessible', accessible: false})
	}
	return rows
}
