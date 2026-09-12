import {htmlToFormattedText} from '../index'

describe('htmlToFormattedText', () => {
	test('a paragraph becomes a plain line', () => {
		expect(htmlToFormattedText('<p>Hello world</p>')).toBe('Hello world')
	})

	test('paragraphs are separated by a blank line', () => {
		expect(htmlToFormattedText('<p>One</p><p>Two</p>')).toBe('One\n\nTwo')
	})

	test('br becomes a single newline', () => {
		expect(htmlToFormattedText('<p>One<br>Two</p>')).toBe('One\nTwo')
	})

	test('an unordered list becomes bullet lines', () => {
		expect(htmlToFormattedText('<ul><li>One</li><li>Two</li></ul>')).toBe('• One\n• Two')
	})

	test('an ordered list is numbered from one', () => {
		expect(htmlToFormattedText('<ol><li>One</li><li>Two</li></ol>')).toBe('1. One\n2. Two')
	})

	// A nested list's rendered text runs directly into its parent `<li>`'s own
	// text with no separator -- the trim that removes the parent item's
	// trailing newline strips the boundary between the two along with it.
	test('a nested list runs into its parent item with no separating newline', () => {
		expect(htmlToFormattedText('<ul><li>One<ul><li>Inner</li></ul></li></ul>')).toBe('• One• Inner')
	})

	test('a blockquote is indented by two spaces', () => {
		expect(htmlToFormattedText('<blockquote>Quoted text</blockquote>')).toBe('  Quoted text')
	})

	// The blank line between the blockquote's two paragraphs is itself indented,
	// because the indent is applied line-by-line to the whole rendered block.
	test('every line of a multi-paragraph blockquote is indented, blank lines included', () => {
		expect(htmlToFormattedText('<blockquote><p>Para one</p><p>Para two</p></blockquote>')).toBe(
			'  Para one\n  \n  Para two',
		)
	})

	test('table elements are stripped entirely', () => {
		expect(htmlToFormattedText('<table><tr><td>Cell</td></tr></table>')).toBe('')
		expect(htmlToFormattedText('<p>Text</p><table><tr><td>Cell</td></tr></table><p>More</p>')).toBe(
			'Text\n\nMore',
		)
	})

	test('empty input is an empty string', () => {
		expect(htmlToFormattedText('')).toBe('')
	})

	test('a div wrapper does not add a level of nesting', () => {
		expect(htmlToFormattedText('<div><p>One</p><p>Two</p></div>')).toBe('One\n\nTwo')
	})

	test('runs of blank lines between block tags collapse away', () => {
		expect(htmlToFormattedText('<p>One</p>\n\n\n<p>Two</p>')).toBe('One\n\nTwo')
	})

	test('bold and entities are not given any special markup', () => {
		expect(htmlToFormattedText('<p><b>Wage:</b> $12</p>')).toBe('Wage: $12')
		expect(htmlToFormattedText('<p>Bread &amp; Butter</p>')).toBe('Bread & Butter')
	})
})
