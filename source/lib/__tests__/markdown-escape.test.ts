import {escapeMarkdownHref, escapeMarkdownText} from '../markdown-escape'

describe('escapeMarkdownText', () => {
	it('escapes what CommonMark would read as syntax', () => {
		expect(escapeMarkdownText('A [b] *c*')).toBe('A \\[b\\] \\*c\\*')
	})
})

describe('escapeMarkdownHref', () => {
	it('encodes what would end or break a link target', () => {
		expect(escapeMarkdownHref('https://x/a (b)')).toBe('https://x/a%20%28b%29')
	})
})
