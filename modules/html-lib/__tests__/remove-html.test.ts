import {fastGetTrimmedText, removeHtml} from '../index'

describe('removeHtml', () => {
	it('strips tags, leaving the text content', () => {
		expect(removeHtml('<p>Hello world</p>')).toBe('Hello world')
	})

	it('separates text split by a tag with a space', () => {
		expect(fastGetTrimmedText('one<br>two')).toBe('one two')
		expect(fastGetTrimmedText('<b>one</b><i>two</i>')).toBe('one two')
	})

	it('decodes character entities', () => {
		expect(fastGetTrimmedText('Bread &amp; Butter')).toBe('Bread & Butter')
		expect(fastGetTrimmedText('<p>caf&eacute;</p>')).toBe('café')
	})

	it('does not treat a decoded entity as markup', () => {
		expect(fastGetTrimmedText('&lt;b&gt;not bold&lt;/b&gt;')).toBe('<b>not bold</b>')
	})

	it('drops script and style bodies', () => {
		expect(fastGetTrimmedText('<style>p {color: red}</style>Hi')).toBe('Hi')
		expect(fastGetTrimmedText('<script>alert(1)</script>Hi')).toBe('Hi')
	})

	it('keeps text from unclosed and malformed tags', () => {
		expect(fastGetTrimmedText('<p>unclosed')).toBe('unclosed')
		expect(fastGetTrimmedText('a < b')).toBe('a < b')
	})

	it('handles plain text without markup', () => {
		expect(fastGetTrimmedText('Student Worker')).toBe('Student Worker')
		expect(fastGetTrimmedText('')).toBe('')
	})

	it('collapses whitespace and trims', () => {
		expect(fastGetTrimmedText('  <p>a\n\n  b</p>  ')).toBe('a b')
	})

	it('handles deeply nested markup without overflowing the stack', () => {
		const depth = 20_000
		const input = `${'<div>'.repeat(depth)}deep${'</div>'.repeat(depth)}`
		expect(fastGetTrimmedText(input)).toBe('deep')
	})

	it('runs in linear time on many unclosed angle brackets', () => {
		// Guards the ReDoS the old `/<[^>]*>/gu` implementation was flagged for:
		// a string of many '<' with no closing '>' made it backtrack.
		const input = `${'<'.repeat(50_000)}!`
		const start = process.hrtime.bigint()
		fastGetTrimmedText(input)
		const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6
		expect(elapsedMs).toBeLessThan(1000)
	})
})
