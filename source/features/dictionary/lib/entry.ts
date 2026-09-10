import deburr from 'lodash/deburr'
import groupBy from 'lodash/groupBy'
import words from 'lodash/words'

import type {DictionaryGroup, NormalizedEntry, Sense, WordType} from '../types'

/**
 * Collapses an entry into the one shape every screen reads: a `senses` array
 * that always holds at least one sense, so `senses[0]` is safe everywhere.
 */
export function normalizeEntry(raw: WordType): NormalizedEntry {
	let senses: Sense[] = raw.senses ?? [{definition: raw.definition ?? ''}]

	return {
		word: raw.word,
		pronunciation: raw.pronunciation,
		partOfSpeech: raw.partOfSpeech,
		senses,
	}
}

/// Every string a sense contributes to search, including those of the senses
/// nested under it.
function senseText(sense: Sense): string[] {
	return [
		sense.definition,
		...(sense.examples ?? []),
		...(sense.subsenses ?? []).flatMap(senseText),
	]
}

/**
 * Every word a reader might search this entry by: the headword plus each
 * sense, citation and sub-sense, lowercased and stripped of accents so an
 * ASCII query still finds "Rølvaag".
 */
export function searchableTerms(entry: NormalizedEntry): string[] {
	let sources = [entry.word, ...entry.senses.flatMap(senseText)]
	let terms = sources.flatMap((source) => words(deburr(source.toLowerCase())))
	return Array.from(new Set(terms))
}

export function filterEntries(entries: NormalizedEntry[], query: string): NormalizedEntry[] {
	if (!query) {
		return entries
	}

	let needle = deburr(query.toLowerCase())
	return entries.filter((entry) => searchableTerms(entry).some((term) => term.includes(needle)))
}

export function groupEntries(entries: NormalizedEntry[]): DictionaryGroup[] {
	let grouped = groupBy(entries, (entry) => entry.word[0] || '?')
	return Object.entries(grouped).map(([title, data]) => ({title, data}))
}
