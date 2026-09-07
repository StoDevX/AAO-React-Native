import {expect, test} from '@jest/globals'
import {stringifyDictionaryEntry} from '../submit'

test('handles a basic term', () => {
	expect(
		stringifyDictionaryEntry({
			word: 'A Word',
			definition: 'My Long-ish Definition',
		}),
	).toMatchSnapshot()
})

test('handles long definitions', () => {
	let def = {
		word: 'ACE',
		definition:
			'Academic Civic Engagement. These are courses that include a component of learning in the community with non-profit or governmental partners.',
	}
	expect(stringifyDictionaryEntry(def)).toMatchSnapshot()
})

test('handles long words', () => {
	let def = {
		word: 'Academic Civic Engagement. These are courses that include a component of learning in the community with non-profit or governmental partners.',
		definition: 'foo',
	}
	expect(stringifyDictionaryEntry(def)).toMatchSnapshot()
})

test('handles newlines in the definition', () => {
	let def = {
		word: 'ACE',
		definition:
			'Academic Civic Engagement.\n\nThese are courses that include\n\na component of learning in the\n\ncommunity with non-profit or\n\ngovernmental partners.',
	}
	expect(stringifyDictionaryEntry(def)).toMatchSnapshot()
})

test('handles an entry with senses', () => {
	expect(
		stringifyDictionaryEntry({
			word: 'ACM',
			senses: [
				{definition: 'The Association for Computing Machinery.'},
				{definition: 'The student chapter.', example: 'ACM runs workshops.'},
			],
		}),
	).toMatchSnapshot()
})

test('handles pronunciation and part of speech', () => {
	expect(
		stringifyDictionaryEntry({
			word: 'Ytterboe',
			pronunciation: 'ˈɪtərboʊ',
			partOfSpeech: 'noun',
			definition: 'A residence hall.',
		}),
	).toMatchSnapshot()
})

test('emits no definition key for an entry with neither field', () => {
	expect(stringifyDictionaryEntry({word: 'Bogus'})).toBe('word: Bogus\n')
})
