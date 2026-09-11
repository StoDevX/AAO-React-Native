import {pronunciationText, senseText} from '../lib/entry-text'

describe('senseText', () => {
	it('leaves a plain definition as it stands', () => {
		expect(senseText({definition: 'The dining hall.'})).toEqual({
			definition: 'The dining hall.',
		})
	})

	// A dictionary runs the citation on after a colon, so the definition's own
	// full stop would read as `The venue.: Grab a snack.`
	it('runs a citation on from the definition, dropping its full stop', () => {
		expect(senseText({definition: 'The venue.', examples: ['Grab a snack.']})).toEqual({
			definition: 'The venue',
			citations: ': Grab a snack.',
		})
	})

	it('divides several citations with a vertical bar', () => {
		expect(senseText({definition: 'alter.', examples: ['first one', 'second one.']})).toEqual({
			definition: 'alter',
			citations: ': first one | second one.',
		})
	})

	// An empty list is a sense nobody has written a citation for yet, not a
	// sense with an empty one.
	it('treats an empty citation list as no citations at all', () => {
		expect(senseText({definition: 'The venue.', examples: []})).toEqual({
			definition: 'The venue.',
		})
	})

	it('brackets a grammar label ahead of the definition', () => {
		expect(senseText({grammar: 'with object', definition: 'alter or modify.'})).toEqual({
			grammar: '[with object] ',
			definition: 'alter or modify.',
		})
	})
})

describe('pronunciationText', () => {
	// The bars are how a dictionary sets phonetics, and they are drawn rather
	// than stored, so the data stays the plain transcription.
	it('sets the phonetics between bars', () => {
		expect(pronunciationText('ˈɪtərboʊ')).toBe('| ˈɪtərboʊ |')
	})

	it('gives nothing to draw for an entry with no pronunciation', () => {
		expect(pronunciationText(undefined)).toBeUndefined()
		expect(pronunciationText('')).toBeUndefined()
	})
})
