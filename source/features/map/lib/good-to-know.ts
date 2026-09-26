import type {Building} from '../types'

/// One row of the card's Good to Know section, after Apple Maps' amenity rows.
export type GoodToKnowRow =
	| {kind: 'abbreviation'; text: string}
	| {kind: 'nickname'; text: string; others: Array<string>}
	| {kind: 'accessibility'; text: string; accessible: boolean}

/// What the card has to say about a building beyond its name: its short code,
/// what people call it, and whether a wheelchair can get in. Nothing for a
/// fact the feed does not know.
export function goodToKnowRows(
	building: Pick<Building, 'abbreviation' | 'nickname' | 'accessibility'>,
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

	if (building.accessibility === 'wheelchair') {
		rows.push({kind: 'accessibility', text: 'Wheelchair accessible', accessible: true})
	} else if (building.accessibility === 'none') {
		rows.push({kind: 'accessibility', text: 'Not wheelchair accessible', accessible: false})
	}
	return rows
}
