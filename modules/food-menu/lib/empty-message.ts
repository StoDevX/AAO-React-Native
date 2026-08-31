/**
 * Which "nothing to show" line applies. Extracted from the list so the choice
 * is testable on its own -- it is a real decision with four outcomes, and the
 * only part of the empty state Jest can meaningfully assert.
 */
export function emptyMessage(args: {
	cafeMessage?: string | null
	specialsOnly: boolean
	anyFilters: boolean
	sectionCount: number
	stationCount: number
}): string {
	let {cafeMessage, specialsOnly, anyFilters, sectionCount, stationCount} = args

	// The meal has stations of its own and the reader's filters emptied it. A
	// cafe can carry a standing message while still serving a full menu -- Bon
	// Appetit leaves them up for weeks -- and showing it here would blame a
	// closure for what a filter did, sending the reader away from a menu that is
	// right in front of them.
	if (anyFilters && sectionCount === 0 && stationCount > 0) {
		return specialsOnly ? NO_SPECIALS : NO_MATCHES
	}
	if (cafeMessage) {
		return cafeMessage
	}
	if (specialsOnly && stationCount === 0) {
		return NO_SPECIALS
	}
	if (anyFilters && sectionCount === 0) {
		return NO_MATCHES
	}
	return 'No items to show.'
}

const NO_MATCHES = 'No items to show. Try changing the filters.'

const NO_SPECIALS = 'No items to show. There may be no specials today. Try changing the filters.'
