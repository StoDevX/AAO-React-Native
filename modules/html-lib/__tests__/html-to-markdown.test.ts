import {htmlToMarkdown} from '../index'

describe('htmlToMarkdown', () => {
	test('a paragraph becomes a plain line', () => {
		expect(htmlToMarkdown('<p>Game operations staff.</p>')).toBe('Game operations staff.')
	})

	test('paragraphs are separated by a blank line', () => {
		expect(htmlToMarkdown('<p>One</p><p>Two</p>')).toBe('One\n\nTwo')
	})

	test('a font-weight:700 span becomes strong', () => {
		expect(htmlToMarkdown('<p><span style="font-weight:700">Wage Range:</span> $12.00</p>')).toBe(
			'**Wage Range:** $12.00',
		)
	})

	test('b and strong are bold too', () => {
		expect(htmlToMarkdown('<p><b>a</b> and <strong>b</strong></p>')).toBe('**a** and **b**')
	})

	// `<span style="font-weight:700">Classification: </span>` is how this data
	// actually arrives. Emphasis with a trailing space inside it is not
	// emphasis at all in markdown, so the space moves outside the markers.
	test('trailing space inside bold moves outside the markers', () => {
		expect(
			htmlToMarkdown('<p><span style="font-weight:700">Classification: </span>Student</p>'),
		).toBe('**Classification:** Student')
	})

	test('an unordered list becomes dashes', () => {
		expect(htmlToMarkdown('<ul><li>One</li><li>Two</li></ul>')).toBe('- One\n- Two')
	})

	test('an ordered list is numbered from one', () => {
		expect(htmlToMarkdown('<ol><li>One</li><li>Two</li></ol>')).toBe('1. One\n2. Two')
	})

	test('a nested list is indented under its item', () => {
		expect(htmlToMarkdown('<ul><li>One<ul><li>Inner</li></ul></li></ul>')).toBe('- One\n\t- Inner')
	})

	test('a link keeps its href', () => {
		expect(htmlToMarkdown('<p>See <a href="https://stolaf.edu">the site</a></p>')).toBe(
			'See [the site](https://stolaf.edu)',
		)
	})

	test('an anchor with no href renders as its text', () => {
		expect(htmlToMarkdown('<p>See <a>the site</a></p>')).toBe('See the site')
	})

	test('br becomes a hard line break', () => {
		expect(htmlToMarkdown('<p>One<br>Two</p>')).toBe('One  \nTwo')
	})

	test('markdown punctuation in text is escaped', () => {
		expect(htmlToMarkdown('<p>Pay is 10*12 per _hour_ [really]</p>')).toBe(
			'Pay is 10\\*12 per \\_hour\\_ \\[really\\]',
		)
	})

	test('a line-leading dash is escaped so it is not a list', () => {
		expect(htmlToMarkdown('<p>- not a list</p>')).toBe('\\- not a list')
	})

	test('a line-leading number is escaped so it is not an ordered list', () => {
		expect(htmlToMarkdown('<p>1. not a list</p>')).toBe('1\\. not a list')
	})

	// This template separates a label from its value with `&nbsp;`, which would
	// otherwise survive into the markdown as a non-breaking space and defeat
	// trimming.
	test('entities are decoded and non-breaking spaces normalised', () => {
		expect(htmlToMarkdown('<p>Ole&nbsp;&amp; Lena</p>')).toBe('Ole & Lena')
	})

	test('script and style bodies are dropped', () => {
		expect(htmlToMarkdown('<p>Text</p><script>alert(1)</script>')).toBe('Text')
	})

	test('empty input is an empty string', () => {
		expect(htmlToMarkdown('')).toBe('')
	})

	test('a div wrapper does not add a level of nesting', () => {
		expect(htmlToMarkdown('<div><p>One</p><p>Two</p></div>')).toBe('One\n\nTwo')
	})
})
