import {htmlToFormattedText} from '../html-to-text'
import {htmlToSegments} from '../html-to-text'

test('plain text passes through unchanged', () => {
	expect(htmlToFormattedText('<p>Hello world</p>')).toBe('Hello world')
})

test('paragraphs separated by double newlines', () => {
	const result = htmlToFormattedText('<p>First</p><p>Second</p>')
	expect(result).toBe('First\n\nSecond')
})

test('<br> becomes a single newline', () => {
	const result = htmlToFormattedText('<p>Line one<br>Line two</p>')
	expect(result).toBe('Line one\nLine two')
})

test('unordered list items become bullet points', () => {
	const result = htmlToFormattedText('<ul><li>Apple</li><li>Banana</li></ul>')
	expect(result).toBe('• Apple\n• Banana')
})

test('ordered list items become numbered points', () => {
	const result = htmlToFormattedText('<ol><li>First</li><li>Second</li></ol>')
	expect(result).toBe('1. First\n2. Second')
})

test('blockquote content is indented', () => {
	const result = htmlToFormattedText(
		'<blockquote><p>Quoted text</p></blockquote>',
	)
	expect(result).toBe('  Quoted text')
})

test('inline tags like strong and em are stripped but text kept', () => {
	const result = htmlToFormattedText('<p>Hello <strong>bold</strong> world</p>')
	expect(result).toBe('Hello bold world')
})

test('anchor tags show only their text', () => {
	const result = htmlToFormattedText(
		'<p>Visit <a href="https://example.com">example</a> today</p>',
	)
	expect(result).toBe('Visit example today')
})

test('strips reddit md wrapper div', () => {
	const result = htmlToFormattedText('<div class="md"><p>Post body</p></div>')
	expect(result).toBe('Post body')
})

test('trailing and leading whitespace trimmed', () => {
	const result = htmlToFormattedText('  <p>Content</p>  ')
	expect(result).toBe('Content')
})

test('no more than two consecutive newlines', () => {
	const result = htmlToFormattedText('<p>One</p><p></p><p>Two</p>')
	expect(result).not.toMatch(/\n{3,}/u)
})

test('table elements are completely ignored (no attribution leak)', () => {
	const html =
		'<div class="md"><p>Real content</p></div><table><tr><td> submitted by <a href="">/u/user</a> <a href="">[link]</a> <a href="">[comments]</a></td></tr></table>'
	expect(htmlToFormattedText(html)).toBe('Real content')
})

test('standalone table with no md div produces empty string', () => {
	const html =
		'<table><tr><td> submitted by <a href="">/u/user</a> <a href="">[link]</a></td></tr></table>'
	expect(htmlToFormattedText(html)).toBe('')
})

// ── htmlToSegments ─────────────────────────────────────────────────────────

describe('htmlToSegments', () => {
	it('plain text produces a single text segment', () => {
		const result = htmlToSegments('<p>Hello world</p>')
		expect(result).toEqual([{type: 'text', text: 'Hello world'}])
	})

	it('anchor tag produces a link segment with url and display text', () => {
		const result = htmlToSegments(
			'<p>Visit <a href="https://example.com">example</a> today</p>',
		)
		expect(result).toEqual([
			{type: 'text', text: 'Visit '},
			{type: 'link', text: 'example', url: 'https://example.com'},
			{type: 'text', text: ' today'},
		])
	})

	it('bare URL in anchor href is preserved', () => {
		const result = htmlToSegments('<a href="https://stolaf.edu">St. Olaf</a>')
		expect(result).toEqual([
			{type: 'link', text: 'St. Olaf', url: 'https://stolaf.edu'},
		])
	})

	it('empty href anchor falls back to text segment', () => {
		const result = htmlToSegments('<a href="">no url</a>')
		expect(result).toEqual([{type: 'text', text: 'no url'}])
	})

	it('collapses adjacent text segments', () => {
		const result = htmlToSegments('<p>one</p><p>two</p>')
		expect(result).toEqual([{type: 'text', text: 'one\n\ntwo'}])
	})

	it('link sandwiched between text produces three segments', () => {
		const result = htmlToSegments(
			'<p>Before <a href="https://x.com">link</a> after</p>',
		)
		expect(result).toHaveLength(3)
		expect(result[1]).toMatchObject({type: 'link', url: 'https://x.com'})
	})
})
