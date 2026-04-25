import {htmlToFormattedText} from '../html-to-text'

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
