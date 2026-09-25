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
})
