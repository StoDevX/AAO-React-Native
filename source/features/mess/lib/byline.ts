import type {Byline, MessStory} from '../types'

/** "By A", "By A and B", "By A, B and C"; null with no writers. */
export function bylineText(bylines: Byline[]): string | null {
	let names = bylines.map((b) => b.name)
	if (names.length === 0) return null
	if (names.length === 1) return `By ${names[0]}`
	return `By ${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

/** The Mess's own short name for a section, where it uses one. */
const SHORT_SECTION: Record<string, string> = {'Arts & Entertainment': 'A&E'}

/** The small label over a headline: section, then column. */
export function kickerText(story: Pick<MessStory, 'section' | 'column'>): string | null {
	if (story.section === null) return null
	let section = SHORT_SECTION[story.section] ?? story.section
	return story.column ? `${section} · ${story.column}` : section
}
