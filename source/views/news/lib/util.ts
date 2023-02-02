import {decode} from '@frogpond/html-lib'
import {toLaxTitleCase} from '@frogpond/titlecase'
import {StoryType} from '../types'

/**
 * Filter any stories with content that we can't handle out of the list:
 *
 * - remove all entries with blank excerpts
 * - remove all entries with a <form from the list
 */
export function filterUnwantedStories(data: StoryType[]): StoryType[] {
	return data
		.filter((entry) => entry.excerpt.trim() !== '')
		.filter((entry) => !entry.content.includes('<form'))
}

/**
 * Clean up a category label:
 *
 * - remove extraneous whitespace
 * - decode entities
 * - titlecase words
 */
export function trimStoryCateogry(label: string): string {
	let evenedWhitespace = label.replace(/\s+/gu, ' ')
	return toLaxTitleCase(decode(evenedWhitespace))
}

/**
 * Clean up new stories:
 *
 * - trim the story category names
 */
export function cleanNewsStories(stories: StoryType[]): StoryType[] {
	return stories.map((s) => ({
		...s,
		categories: s.categories.map(trimStoryCateogry),
	}))
}
