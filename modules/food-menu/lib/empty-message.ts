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

	if (cafeMessage) {
		return cafeMessage
	}
	if (specialsOnly && stationCount === 0) {
		return 'No items to show. There may be no specials today. Try changing the filters.'
	}
	if (anyFilters && sectionCount === 0) {
		return 'No items to show. Try changing the filters.'
	}
	return 'No items to show.'
}
