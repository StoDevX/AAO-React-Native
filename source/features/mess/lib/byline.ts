import type {Byline, MessStory} from '../types'

/** "A", "A and B", "A, B and C"; null with no writers. */
function writerNames(bylines: Byline[]): string | null {
	let names = bylines.map((b) => b.name)
	if (names.length === 0) return null
	if (names.length === 1) return names[0] ?? null
	return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

/** "By A", "By A and B", "By A, B and C"; null with no writers. */
export function bylineText(bylines: Byline[]): string | null {
	let names = writerNames(bylines)
	return names ? `By ${names}` : null
}

/** The day a story ran, spelled out: "April 29, 2026". */
export function bylineDate(published: string): string {
	return new Date(published).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	})
}

/** The writers and the date on one line, as a quieter page credits them: "A and B · April 29, 2026". */
export function creditLine(story: Pick<MessStory, 'bylines' | 'published'>): string {
	let names = writerNames(story.bylines)
	let date = bylineDate(story.published)
	return names ? `${names} · ${date}` : date
}

/** What VoiceOver reads for a comic or artwork, which comes with no alt text: "Title, by A". */
export function imageLabel(story: Pick<MessStory, 'title' | 'bylines'>): string {
	let names = writerNames(story.bylines)
	return names ? `${story.title}, by ${names}` : story.title
}

/** The Mess's own short name for a section, where it uses one. */
const SHORT_SECTION: Record<string, string> = {'Arts & Entertainment': 'A&E'}

/** The small label over a headline: section, then column. */
export function kickerText(story: Pick<MessStory, 'section' | 'column'>): string | null {
	if (story.section === null) return null
	let section = SHORT_SECTION[story.section] ?? story.section
	return story.column ? `${section} · ${story.column}` : section
}
