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
	/** Whether the cafe is shut, which leaves the meal and its window off the line. */
	closed: boolean
	/** When a shut cafe opens again today, e.g. `4PM`, or `null` if it does not. */
	opensAt: string | null
}

/**
 * What the eye reads as the break between two facts on the subtitle's one
 * line. Exported because VoiceOver has to find them again to read the line as
 * separate facts rather than as one phrase.
 */
export const SUBTITLE_SEPARATOR = ' • '

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
 *
 * A shut cafe is decided here, once, rather than left to each caller to
 * remember for each part. Neither the meal nor its window is being served, so
 * neither is drawn. One that opens again today says when, beside the day it is
 * shut on: `Sunday • Closed until 4PM`. One that does not has no line at all.
 */
export function menuSubtitle(parts: SubtitleParts): string {
	let {weekdayShort, weekdayLong, cafeName, mealName, time, closed, opensAt} = parts

	if (closed) {
		return opensAt
			? [weekdayLong, `Closed until ${opensAt}`].filter(Boolean).join(SUBTITLE_SEPARATOR)
			: ''
	}

	let meal = namesTheCafe(mealName, cafeName) ? null : mealName
	let weekday = meal ? weekdayShort : weekdayLong

	return [weekday, meal, time].filter(Boolean).join(SUBTITLE_SEPARATOR)
}

/**
 * Words that name a kind of place rather than a particular one, and so say
 * nothing about which cafe is which. `Weitz Café` and `Weitz Center` are one
 * building under two of them.
 *
 * Both spellings of `cafe`, rather than folding the accent away: `normalize`
 * is the obvious tool and Hermes is not somewhere to find out whether it
 * behaves, since Jest runs on Node and would pass either way.
 */
const PLACE_WORDS = new Set([
	'a',
	'an',
	'cafe',
	'café',
	'center',
	'centre',
	'commons',
	'hall',
	'kitchen',
	'the',
])

/** Every word in a name, lowercased and stripped of its punctuation. */
function words(name: string): string[] {
	return name
		.toLowerCase()
		.split(/[^\p{L}\p{N}]+/u)
		.filter(Boolean)
}

/** The words in a name that actually pick out a place. */
function distinctiveWords(name: string): string[] {
	return words(name).filter((word) => !PLACE_WORDS.has(word))
}

/**
 * Whether a meal says nothing the cafe's name has not already said.
 *
 * BonApp names a daypart after its venue often enough to be worth handling:
 * The Cage's only daypart is `The Cage`, and Weitz Center serves a `Weitz
 * Café`. Drawn under the cafe's own name, either reads as a stutter.
 *
 * Every distinctive word has to be accounted for, not merely one of them -- a
 * `Weitz Lunch` is still a lunch, and dropping it would cost the reader the
 * only word that said which meal they were looking at.
 *
 * A meal whose whole name is place words has no distinctive word to account
 * for, and a rule written over those alone would drop it against any cafe at
 * all -- `Kitchen` is not `Stav Hall` said twice. Such a name is weighed
 * against everything the cafe is called instead, place words included, so
 * `Café` goes under `Weitz Café` and stays under `Stav Hall`.
 */
function namesTheCafe(mealName: string | null, cafeName: string): boolean {
	if (!mealName) {
		return false
	}

	let mealWords = distinctiveWords(mealName)
	let cafeWords = new Set(distinctiveWords(cafeName))

	if (mealWords.length === 0) {
		mealWords = words(mealName)
		cafeWords = new Set(words(cafeName))
	}

	return mealWords.every((word) => cafeWords.has(word))
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
