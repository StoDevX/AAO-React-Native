/** What the line under a cafe's name is assembled from. */
type SubtitleParts = {
	/** The weekday abbreviated, used when a meal shares the line. */
	weekdayShort: string | null
	/** The weekday written out, used when it does not. */
	weekdayLong: string | null
	/** The cafe titling the screen, which the meal is measured against. */
	cafeName: string
	/** The meal on screen, or `null` for a cafe serving one meal today. */
	mealName: string | null
	/** The window that meal is served, e.g. `11AM – 1:30PM`. */
	time: string | null
}

/**
 * The line under the cafe's name, e.g. `Sun • Lunch • 11AM – 1:30PM`.
 *
 * A meal named after the cafe serving it is left out: BonApp names The Cage's
 * daypart `The Cage`, and a line reading `Sun • The Cage • 7:30AM – 8PM` under
 * the words `The Cage` says the same thing twice.
 *
 * The weekday is written out whenever no meal survives to share the line. Three
 * letters beside two other facts read as a day; three letters alone out there
 * read as a word that got cut off.
 */
export function menuSubtitle(parts: SubtitleParts): string {
	let {weekdayShort, weekdayLong, cafeName, mealName, time} = parts

	let meal = namesTheCafe(mealName, cafeName) ? null : mealName
	let weekday = meal ? weekdayShort : weekdayLong

	return [weekday, meal, time].filter(Boolean).join(' • ')
}

/**
 * Whether a meal is named after the cafe serving it.
 *
 * Compared past casing and surrounding space, since the two names reach us from
 * different places -- the cafe's from the route that drew the screen, the
 * meal's from whatever BonApp published that morning.
 */
function namesTheCafe(mealName: string | null, cafeName: string): boolean {
	if (!mealName) {
		return false
	}

	return mealName.trim().toLowerCase() === cafeName.trim().toLowerCase()
}

/**
 * The window as VoiceOver should hear it. Read aloud, the dash in
 * `11AM – 1:30PM` is either silence or the word "dash".
 *
 * The spaces around the dash go with it, or the words it separates end up
 * three spaces apart.
 */
export function spokenTime(time: string): string {
	return time.replace(' – ', ' to ')
}
