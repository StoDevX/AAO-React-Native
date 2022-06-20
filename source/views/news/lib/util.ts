import {StoryType} from '../types'

// remove all entries with blank excerpts
// remove all entries with a <form from the list
export const cleanEntries = (data: StoryType[]): StoryType[] => {
	return data
		.filter((entry) => entry.excerpt.trim() !== '')
		.filter((entry) => !entry.content.includes('<form'))
}

