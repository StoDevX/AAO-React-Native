import {decode} from '@frogpond/html-lib'
import {toLaxTitleCase} from '@frogpond/titlecase'
import {StoryType} from '../types'

// remove all entries with blank excerpts
// remove all entries with a <form from the list
export const cleanEntries = (data: StoryType[]): StoryType[] => {
	return data
		.filter((entry) => entry.excerpt.trim() !== '')
		.filter((entry) => !entry.content.includes('<form'))
}

// remove extraneous whitspace
// decode entities
// titlecase words
export const trimStoryCateogry = (label: string): string => {
	let evenedWhitespace = label.replace(/\s+/gu, ' ')
	return toLaxTitleCase(decode(evenedWhitespace))
}

export const EXCERPT_LENGTH = 200

/// Shared between the RSS and Atom parsers, which both fall back to a
/// truncated `content` for `excerpt` when the feed carries no dedicated
/// excerpt field (`<description>`/`<summary>`) of its own -- keeping this in
/// one place is what keeps that fallback identical on both sides.
export function truncate(text: string, length: number): string {
	if (text.length <= length) return text
	return text.slice(0, length).trimEnd() + '…'
}

let storyCategories = (story: StoryType): string[] =>
	(story.categories ?? []).map((category) => trimStoryCateogry(category))

/**
 * Every category the given stories carry, once each, sorted A-Z. Expects
 * entries that have already been through `cleanEntries`, so the picker offers
 * only categories the list can actually show.
 */
export function extractCategories(stories: StoryType[]): string[] {
	let categories = new Set(stories.flatMap((story) => storyCategories(story)))
	return [...categories].sort((a, b) => a.localeCompare(b))
}

/** The stories carrying `category`, or all of them when none is chosen. */
export function filterByCategory(stories: StoryType[], category: string | null): StoryType[] {
	if (category === null) return stories
	return stories.filter((story) => storyCategories(story).includes(category))
}

/**
 * The chosen category, or null once the feed stops carrying it. A category
 * that outlives the stories that named it filters the list to nothing while
 * every switch in the picker reads off, and persistence makes that permanent.
 */
export function resolveCategory(category: string | null, categories: string[]): string | null {
	return category !== null && categories.includes(category) ? category : null
}
