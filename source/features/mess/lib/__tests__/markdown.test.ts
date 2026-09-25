import {describe, expect, it} from '@jest/globals'
import {runsToMarkdown} from '../markdown'

describe('runsToMarkdown', () => {
	it('passes plain words through', () => {
		expect(runsToMarkdown([{text: 'Plain words'}])).toBe('Plain words')
	})

	it('escapes every character Markdown would read as syntax', () => {
		expect(runsToMarkdown([{text: '\\ * _ [ ] ( ) # + - . ! `'}])).toBe(
			'\\\\ \\* \\_ \\[ \\] \\( \\) \\# \\+ \\- \\. \\! \\`',
		)
	})

	it("escapes tildes, so a story's own ~~ never strikes text through", () => {
		expect(runsToMarkdown([{text: '~~old~~'}])).toBe('\\~\\~old\\~\\~')
	})

	it('escapes an angle bracket, so a literal <url> never becomes an autolink', () => {
		expect(runsToMarkdown([{text: '<https://x.test/>'}])).toBe('\\<https://x\\.test/>')
	})

	it('escapes an ampersand, so a literal entity is never decoded', () => {
		expect(runsToMarkdown([{text: '&copy;'}])).toBe('\\&copy;')
	})

	it('wraps bold and italic runs', () => {
		expect(
			runsToMarkdown([
				{text: 'b', bold: true},
				{text: 'i', italic: true},
			]),
		).toBe('**b***i*')
	})

	it('keeps spaces outside the markers, where Markdown needs them', () => {
		expect(runsToMarkdown([{text: 'A'}, {text: ' bold ', bold: true}, {text: 'word'}])).toBe(
			'A **bold** word',
		)
	})

	it('writes a link, escaping its text', () => {
		expect(runsToMarkdown([{text: 'St. Olaf', href: 'https://stolaf.edu/'}])).toBe(
			'[St\\. Olaf](https://stolaf.edu/)',
		)
	})

	it('percent-encodes parentheses and spaces in a link target', () => {
		expect(runsToMarkdown([{text: 'x', href: 'https://x.test/a (b)'}])).toBe(
			'[x](https://x.test/a%20%28b%29)',
		)
	})

	it('nests a bold italic link', () => {
		expect(runsToMarkdown([{text: 'go', bold: true, italic: true, href: 'https://x.test/'}])).toBe(
			'[***go***](https://x.test/)',
		)
	})

	it('leaves a run of only whitespace unwrapped', () => {
		expect(runsToMarkdown([{text: ' ', bold: true}])).toBe(' ')
	})

	it('keeps a line break', () => {
		expect(runsToMarkdown([{text: 'one\ntwo'}])).toBe('one\ntwo')
	})

	it('wraps the words of a styled run that spans a line break', () => {
		expect(runsToMarkdown([{text: 'a\nb', bold: true}])).toBe('**a\nb**')
	})

	it('keeps line breaks at the edges of a styled run outside the markers', () => {
		expect(runsToMarkdown([{text: '\nword\n', italic: true}])).toBe('\n*word*\n')
	})

	it('separates a word from a styled run that opens on punctuation', () => {
		expect(runsToMarkdown([{text: 'word'}, {text: '(note)', bold: true}])).toBe(
			'word\u200B**\\(note\\)**',
		)
	})

	it('separates a styled run that closes on punctuation from a following word', () => {
		expect(runsToMarkdown([{text: 'Note:', bold: true}, {text: 'Text'}])).toBe(
			'**Note:**\u200BText',
		)
	})

	it('adds no separator where a space already sits at the join', () => {
		expect(runsToMarkdown([{text: 'word '}, {text: '(note)', italic: true}, {text: ' Text'}])).toBe(
			'word *\\(note\\)* Text',
		)
	})

	it('adds no separator between letters', () => {
		expect(runsToMarkdown([{text: 'un'}, {text: 'break', bold: true}, {text: 'able'}])).toBe(
			'un**break**able',
		)
	})
})
