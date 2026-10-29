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
 * restyling its title. A title of punctuation alone has nothing left to
 * compare, so it matches only itself, spelled the same.
 */
export function sameShowTitle(one: string, two: string): boolean {
	let key = titleKey(one)
	return key === '' ? one === two : key === titleKey(two)
}
