import {VOCAB_SEPARATOR} from '../identifiers'
import {addVocab, useChaosVocab, VOCAB_LIMIT, vocabLabel, wordsIn} from '../vocab'

beforeEach(() => {
	useChaosVocab.setState({words: []})
})

test('takes strings of 3 to 40 characters with a letter in them', () => {
	let body = JSON.stringify({
		name: 'Stav Hall',
		short: 'ab',
		long: 'x'.repeat(41),
		code: '12345',
		nested: [{label: 'Lunch'}, {label: 'Dinner'}],
		count: 3,
	})
	expect(wordsIn(body).sort()).toEqual(['Dinner', 'Lunch', 'Stav Hall'])
})

test('leaves out a string with a newline or the separator in it', () => {
	let body = JSON.stringify({a: 'two\nlines', b: `split${VOCAB_SEPARATOR}here`, c: 'Regents'})
	expect(wordsIn(body)).toEqual(['Regents'])
})

test('takes nothing from a body that is not JSON', () => {
	expect(wordsIn('<html>Stav Hall</html>')).toEqual([])
})

test('keeps the words sorted and without repeats, the first hundred only', () => {
	addVocab(JSON.stringify(['Stav', 'Cage', 'Stav']))
	expect(useChaosVocab.getState().words).toEqual(['Cage', 'Stav'])
	addVocab(
		JSON.stringify(Array.from({length: 150}, (_, i) => `word ${String(i).padStart(3, '0')}`)),
	)
	let words = useChaosVocab.getState().words
	expect(words).toHaveLength(VOCAB_LIMIT)
	expect(words[0]).toBe('Cage')
	expect([...words].sort()).toEqual(words)
})

test('labels the words for the monkey, and an empty set as the separator alone', () => {
	expect(vocabLabel(['Cage', 'Stav'])).toBe(`Cage${VOCAB_SEPARATOR}Stav`)
	expect(vocabLabel([])).toBe(VOCAB_SEPARATOR)
})
