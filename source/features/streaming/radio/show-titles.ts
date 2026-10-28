/**
 * A show's title with what a station changes without renaming the show taken
 * out: case, spacing, curly apostrophes and closing punctuation.
 */
function titleKey(title: string): string {
	return title
		.toLowerCase()
		.replaceAll(/[‘’]/gu, "'")
		.replaceAll(/\s+/gu, ' ')
		.trim()
		.replace(/[\s.!?…]+$/u, '')
}

/**
 * Whether two titles name the same show, so a follow survives the station
 * restyling its title. A title with nothing left to compare matches nothing.
 */
export function sameShowTitle(one: string, two: string): boolean {
	let key = titleKey(one)
	return key !== '' && key === titleKey(two)
}
