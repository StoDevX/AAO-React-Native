import {describe, expect, it} from '@jest/globals'

import {filterEntries, groupEntries, normalizeEntry, searchableTerms} from '../lib/entry'

describe('normalizeEntry', () => {
	it('collapses a legacy definition into a single sense', () => {
		expect(normalizeEntry({word: 'Caf', definition: 'The dining hall.'})).toEqual({
			word: 'Caf',
			senses: [{definition: 'The dining hall.'}],
		})
	})

	it('passes senses through untouched', () => {
		let raw = {
			word: 'ACM',
			senses: [
				{definition: 'The Association for Computing Machinery.'},
				{definition: 'The student chapter.', examples: ['ACM runs workshops.']},
			],
		}

		expect(normalizeEntry(raw).senses).toEqual(raw.senses)
	})

	it('carries pronunciation and part of speech across', () => {
		let entry = normalizeEntry({
			word: 'Ytterboe',
			pronunciation: 'ˈɪtərboʊ',
			partOfSpeech: 'noun',
			definition: 'A residence hall.',
		})

		expect(entry.pronunciation).toBe('ˈɪtərboʊ')
		expect(entry.partOfSpeech).toBe('noun')
	})

	it('omits pronunciation and part of speech when the entry has none', () => {
		let entry = normalizeEntry({word: 'Caf', definition: 'The dining hall.'})

		expect(entry.pronunciation).toBeUndefined()
		expect(entry.partOfSpeech).toBeUndefined()
	})

	// The schema forbids an entry with neither field, so this only happens if
	// the server sends something malformed. One empty sense keeps `senses[0]`
	// safe for every caller, which a zero-length array would not.
	it('yields one empty sense when the entry has neither field', () => {
		expect(normalizeEntry({word: 'Broken'}).senses).toEqual([{definition: ''}])
	})
})

describe('searchableTerms', () => {
	it('covers the word, every sense, and every example', () => {
		let terms = searchableTerms(
			normalizeEntry({
				word: 'Pause',
				senses: [
					{definition: 'The student-run venue.'},
					{definition: 'A snack counter.', examples: ['Grab mozzarella sticks.']},
				],
			}),
		)

		expect(terms).toEqual(
			expect.arrayContaining(['pause', 'student', 'venue', 'snack', 'mozzarella']),
		)
	})

	it('deburrs accents so a plain-ASCII query still matches', () => {
		expect(
			searchableTerms(normalizeEntry({word: 'Rølvaag', definition: 'The library.'})),
		).toContain('rolvaag')
	})

	it('does not repeat a term that appears in both the word and a sense', () => {
		let terms = searchableTerms(normalizeEntry({word: 'Caf', definition: 'The Caf is a hall.'}))

		expect(terms.filter((term) => term === 'caf')).toHaveLength(1)
	})
})

describe('filterEntries', () => {
	let entries = [
		normalizeEntry({word: 'Caf', definition: 'The dining hall.'}),
		normalizeEntry({word: 'Pause', definition: 'The student-run venue.'}),
	]

	it('keeps entries whose word or definition contains the query', () => {
		expect(filterEntries(entries, 'din').map((e) => e.word)).toEqual(['Caf'])
	})

	it('returns everything for an empty query', () => {
		expect(filterEntries(entries, '')).toHaveLength(2)
	})

	it('matches regardless of the query case', () => {
		expect(filterEntries(entries, 'PAUSE').map((e) => e.word)).toEqual(['Pause'])
	})
})

describe('groupEntries', () => {
	it('groups by first letter, preserving the incoming order', () => {
		let entries = [
			normalizeEntry({word: 'Caf', definition: 'a'}),
			normalizeEntry({word: 'Cage', definition: 'b'}),
			normalizeEntry({word: 'Pause', definition: 'c'}),
		]

		expect(groupEntries(entries)).toEqual([
			{title: 'C', data: [entries[0], entries[1]]},
			{title: 'P', data: [entries[2]]},
		])
	})

	it('creates no group for a letter with no entries', () => {
		expect(groupEntries([normalizeEntry({word: 'Caf', definition: 'a'})])).toHaveLength(1)
	})

	it('files an entry with an empty word under a question mark', () => {
		expect(groupEntries([normalizeEntry({word: '', definition: 'a'})])[0]?.title).toBe('?')
	})
})
