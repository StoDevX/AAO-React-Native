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
