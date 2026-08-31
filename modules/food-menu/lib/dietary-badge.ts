import type {MasterCorIconMapType} from '../types'

/**
 * How BonApp draws its own dietary legend: a two-or-fewer character token in a
 * filled circle. Reproducing their tokens and colours rather than inventing a
 * legend keeps the marks recognisable to anyone who has read a BonApp menu
 * board, and costs nothing to draw -- the alternative is downloading a PNG per
 * category and reading it off disk on every row that carries it.
 *
 * Keyed by BonApp's own category id, which is stable across cafes: `1` is
 * Vegetarian at Stav and at The Cage. Colours are sampled from their legend.
 */
const BADGES: Record<string, {token: string; fill: string; kern?: number}> = {
	1: {token: 'V', fill: '#7D7F34'},
	3: {token: 'S', fill: '#0084AD'},
	// A small-capital G (U+0262), as the cafe sets it: a full-height V leading a
	// smaller G, rather than two letters of equal weight.
	4: {token: 'Vɢ', fill: '#14844C'},
	6: {token: 'FF', fill: '#723E31'},
	// Their own token, and deliberately not "GF": the kitchen does not promise
	// no cross-contact, and a gluten-free badge would claim more than the data
	// supports.
	//
	// No tightening: an arrow carries its own side bearings, and pulling the G
	// into it the way two letters want closes the gap the arrowhead needs.
	9: {token: '↓G', fill: '#B57434', kern: 0},
	10: {token: 'HL', fill: '#003369'},
	18: {token: 'H', fill: '#F07621'},
	252: {token: 'SD', fill: '#61223F'},
}

/** Neutral fill for a category BonApp added after this table was written. */
const UNKNOWN_FILL = '#6B6B70'

/**
 * Two capitals at this size sit too far apart for a 15pt disc, so they are
 * pulled together by default. A token that should not be is marked in the table.
 */
const DEFAULT_KERN = -0.5

/**
 * The disc a badge is drawn in, and the type size inside it. Shared rather than
 * restated by each renderer: the mark appears in a SwiftUI list and, until the
 * filter popovers stop being React Native, in an RN one -- and two copies of
 * these numbers drifted apart the first time one was adjusted.
 */
export const BADGE_SIDE = 15

/**
 * As large as the disc takes: past this the line box outgrows the frame. Two
 * character tokens overrun it and scale down, which is what leaves `V` and `H`
 * larger than `Vɢ` and `HL`, as the cafe sets them.
 */
export const BADGE_POINT_SIZE = 13

const SKIPPED_WORDS = new Set(['a', 'and', 'to', 'the', 'with', 'without'])

/**
 * Initials for a category the table has never heard of -- "Locally Crafted"
 * becomes "LC". BonApp's own tokens are not always the initials ("Seafood
 * Watch" is "S", not "SW"), which is why the table above is explicit rather
 * than derived; this only has to be reasonable, not exact.
 */
export function deriveToken(label: string): string {
	let words = label
		.split(/[\s-]+/u)
		.filter((word) => word && !SKIPPED_WORDS.has(word.toLowerCase()))

	if (words.length === 0) {
		return '?'
	}

	if (words.length === 1) {
		return (words[0] ?? '').slice(0, 1).toUpperCase()
	}

	return words
		.slice(0, 2)
		.map((word) => word.slice(0, 1).toUpperCase())
		.join('')
}

export type DietaryBadgeType = {
	key: string
	token: string
	fill: string
	/** Letter-spacing for this token, in points. Negative pulls the pair together. */
	kern: number
	/** The category's full name, for VoiceOver and for the detail screen. */
	label: string
}

/**
 * The badge for one of a cafe's dietary categories.
 */
export function dietaryBadge(key: string, corIcons: MasterCorIconMapType): DietaryBadgeType {
	let label = corIcons[key]?.label ?? ''
	let known = BADGES[key]

	return {
		key,
		label,
		token: known?.token ?? deriveToken(label),
		fill: known?.fill ?? UNKNOWN_FILL,
		kern: known?.kern ?? DEFAULT_KERN,
	}
}
