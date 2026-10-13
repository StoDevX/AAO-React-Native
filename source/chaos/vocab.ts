import {create} from 'zustand'

import {VOCAB_SEPARATOR} from './identifiers'

/** How many words the app publishes. */
export const VOCAB_LIMIT = 100

/** Words the app has received, sorted, for a session to type. */
export const useChaosVocab = create<{words: string[]}>(() => ({words: []}))

/** Whether `text` is something a person might search for. */
function isWord(text: string): boolean {
	return (
		text.length >= 3 &&
		text.length <= 40 &&
		/\p{L}/u.test(text) &&
		!text.includes('\n') &&
		!text.includes(VOCAB_SEPARATOR)
	)
}

/** Every string worth typing in a JSON body; none for a body that is not JSON. */
export function wordsIn(body: string): string[] {
	let parsed: unknown
	try {
		parsed = JSON.parse(body)
	} catch {
		return []
	}
	let words: string[] = []
	let visit = (value: unknown): void => {
		if (typeof value === 'string') {
			if (isWord(value)) words.push(value)
		} else if (Array.isArray(value)) {
			value.forEach(visit)
		} else if (value && typeof value === 'object') {
			Object.values(value).forEach(visit)
		}
	}
	visit(parsed)
	return words
}

/** Orders strings by UTF-16 code unit, the same on every machine. */
function compare(a: string, b: string): number {
	return a < b ? -1 : a > b ? 1 : 0
}

/** Adds the words in `body` to those published. */
export function addVocab(body: string): void {
	let words = wordsIn(body)
	if (words.length === 0) return
	let merged = [...new Set([...useChaosVocab.getState().words, ...words])].sort(compare)
	useChaosVocab.setState({words: merged.slice(0, VOCAB_LIMIT)})
}

/** The vocab element's label: the separator alone when there are no words, so it is never empty. */
export function vocabLabel(words: string[]): string {
	return words.length > 0 ? words.join(VOCAB_SEPARATOR) : VOCAB_SEPARATOR
}
