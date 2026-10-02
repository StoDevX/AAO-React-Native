import {MAIN_SECTIONS} from './posts'
import type {MessStory} from '../types'

/** The section whose photographed story leads an issue when the editors featured none. */
const NEWS = 'News'

/**
 * What the lead rule reads of a story. A full story and a light post both carry it; `photo`
 * is null when there is no real photo (none, or the Mess logo).
 */
type LeadCandidate = {featured: boolean; section: string | null; photo: unknown}

/**
 * An issue's lead, from its stories newest first as WordPress lists them: the newest one the
 * editors featured, else the newest News story with a real photo, else the newest story.
 */
export function leadStory<T extends LeadCandidate>(stories: T[]): T | undefined {
	return (
		stories.find((story) => story.featured) ??
		stories.find((story) => story.section === NEWS && story.photo !== null) ??
		stories[0]
	)
}

/** One row of cards on a front page: a section's stories, or, with no section, every other story. */
export type Shelf = {section: string | null; stories: MessStory[]}

/**
 * A front page's shelves: one per print section in the paper's order, then one of every story
 * in any other section, or none. Each keeps its stories newest first; the lead is on none of
 * them, and a section with no stories gets no shelf.
 */
export function shelvesOf(stories: MessStory[], leadId: number | undefined): Shelf[] {
	let rest = stories.filter((story) => story.id !== leadId)
	let sections: Shelf[] = MAIN_SECTIONS.map((section) => ({
		section,
		stories: rest.filter((story) => story.section === section),
	}))
	let others: Shelf = {
		section: null,
		stories: rest.filter(
			(story) => story.section === null || !MAIN_SECTIONS.includes(story.section),
		),
	}
	return [...sections, others].filter((shelf) => shelf.stories.length > 0)
}

/**
 * Every story an issue holds in one section, newest first, for the section's own list. Unlike its
 * shelf, the list keeps the lead: on the list, it is one more story of the section.
 */
export function sectionStories(stories: MessStory[], section: string): MessStory[] {
	return stories.filter((story) => story.section === section)
}
