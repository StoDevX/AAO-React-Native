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

	it('escapes an angle bracket, so a literal <url> is not read as an angle-bracket autolink', () => {
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

	it('moves opening punctuation outside the markers when a word touches it', () => {
		expect(runsToMarkdown([{text: 'word'}, {text: '(note)', bold: true}])).toBe(
			'word\\(**note\\)**',
		)
	})

	it('moves closing punctuation outside the markers when a word follows it', () => {
		expect(runsToMarkdown([{text: 'Note:', bold: true}, {text: 'Text'}])).toBe('**Note**:Text')
	})

	it('leaves a styled run of only punctuation beside a word unwrapped', () => {
		expect(runsToMarkdown([{text: 'Hi'}, {text: '!', bold: true}])).toBe('Hi\\!')
	})

	it('keeps punctuation inside a link, whose brackets already part the markers from the word', () => {
		expect(
			runsToMarkdown([{text: 'word'}, {text: '(note)', bold: true, href: 'https://x.test/'}]),
		).toBe('word[**\\(note\\)**](https://x.test/)')
	})

	it('keeps punctuation inside the markers where a space sits at the join', () => {
		expect(runsToMarkdown([{text: 'word '}, {text: '(note)', italic: true}, {text: ' Text'}])).toBe(
			'word *\\(note\\)* Text',
		)
	})

	it('keeps adjacent letter edges as they are', () => {
		expect(runsToMarkdown([{text: 'un'}, {text: 'break', bold: true}, {text: 'able'}])).toBe(
			'un**break**able',
		)
	})

	it('moves opening punctuation outside the markers when a styled word touches it', () => {
		expect(
			runsToMarkdown([
				{text: 'word', bold: true},
				{text: '(note)', italic: true},
			]),
		).toBe('**word**\\(*note\\)*')
	})

	it('moves closing punctuation outside the markers when a styled word follows it', () => {
		expect(
			runsToMarkdown([
				{text: 'Note:', bold: true},
				{text: 'Text', italic: true},
			]),
		).toBe('**Note**:*Text*')
	})

	it('moves punctuation between an italic word and a bold run', () => {
		expect(
			runsToMarkdown([
				{text: 'word', italic: true},
				{text: '(note)', bold: true},
			]),
		).toBe('*word*\\(**note\\)**')
	})

	it('treats a link beside a styled run as punctuation, since its brackets sit outside', () => {
		expect(
			runsToMarkdown([
				{text: 'go', href: 'https://x.test/'},
				{text: '(x)', bold: true},
			]),
		).toBe('[go](https://x.test/)**\\(x\\)**')
	})

	it('moves nothing where punctuation meets punctuation between styled runs', () => {
		expect(
			runsToMarkdown([
				{text: 'Note:', bold: true},
				{text: '(x)', italic: true},
			]),
		).toBe('**Note:***\\(x\\)*')
	})
})
