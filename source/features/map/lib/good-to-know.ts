import * as Localization from 'expo-localization'

import type {Building} from '../types'

/// One row of the card's Good to Know section, after Apple Maps' amenity rows.
export type GoodToKnowRow =
	| {kind: 'abbreviation'; text: string}
	| {kind: 'nickname'; text: string; others: Array<string>}
	| {kind: 'accessibility'; text: string; accessible: boolean}
	| {kind: 'length'; text: string}

/// How the device measures distance: its language, for the digits, and its
/// unit system, as iOS reports it. Null when iOS does not say.
export type DistanceUnits = {
	languageTag: string
	measurementSystem: 'metric' | 'us' | 'uk' | null
}

const METRES_PER_MILE = 1609.344

/// The regions that measure road distance in miles.
const MILE_REGIONS = new Set(['US', 'GB', 'LR', 'MM'])

/// The device's own units, read once per call: a person can change them in
/// Settings, and a card is drawn rarely enough not to cache them.
export function deviceUnits(): DistanceUnits {
	let [locale] = Localization.getLocales()
	return {
		languageTag: locale?.languageTag ?? 'en-US',
		measurementSystem: locale?.measurementSystem ?? null,
	}
}

function usesMiles({languageTag, measurementSystem}: DistanceUnits): boolean {
	if (measurementSystem) {
		return measurementSystem !== 'metric'
	}
	// The tag's region subtag, "US" in "en-US". Read by hand: Hermes has no
	// `Intl.Locale`, so `new Intl.Locale(tag)` throws on a device.
	let region = languageTag.split('-').find((part) => /^[A-Z]{2}$/u.test(part))
	return region ? MILE_REGIONS.has(region) : false
}

/// A length as a person walking it thinks of it: tenths of a mile or of a
/// kilometre, as the device measures, in its language's digits, and never zero
/// for a trail that is there.
///
/// The number is formatted and the unit added here, rather than through
/// `Intl.NumberFormat`'s unit style: on Hermes that style ignores the fraction
/// digits it is given, and joins the number and "mi" with no space.
export function formatDistance(metres: number, units: DistanceUnits): string {
	let miles = usesMiles(units)
	let value = metres / (miles ? METRES_PER_MILE : 1000)
	let rounded = Math.max(0.1, Math.round(value * 10) / 10)
	let number = new Intl.NumberFormat(units.languageTag, {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	}).format(rounded)
	return `${number} ${miles ? 'mi' : 'km'}`
}

/// What the card has to say about a place beyond its name: its short code,
/// what people call it, how long it is if it is a trail, and whether a
/// wheelchair can get in. Nothing for a fact the feed does not know.
export function goodToKnowRows(
	building: Pick<Building, 'abbreviation' | 'nickname' | 'accessibility' | 'length'>,
	units: DistanceUnits = deviceUnits(),
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
		rows.push({kind: 'length', text: formatDistance(building.length, units)})
	}

	if (building.accessibility === 'wheelchair') {
		rows.push({kind: 'accessibility', text: 'Wheelchair accessible', accessible: true})
	} else if (building.accessibility === 'none') {
		rows.push({kind: 'accessibility', text: 'Not wheelchair accessible', accessible: false})
	}
	return rows
}
