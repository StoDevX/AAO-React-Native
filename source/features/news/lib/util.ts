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
