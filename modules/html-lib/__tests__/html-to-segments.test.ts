import {htmlToSegments} from '../index'

describe('htmlToSegments', () => {
	test('plain text becomes a single text segment', () => {
		expect(htmlToSegments('<p>Hello world</p>')).toEqual([{type: 'text', text: 'Hello world'}])
	})

	test('a link becomes its own segment, splitting the surrounding text', () => {
		expect(htmlToSegments('<p>See <a href="https://stolaf.edu">the site</a></p>')).toEqual([
			{type: 'text', text: 'See '},
			{type: 'link', text: 'the site', url: 'https://stolaf.edu'},
		])
	})

	test('an anchor with no href falls back to plain text and merges with its neighbor', () => {
		expect(htmlToSegments('<p>See <a>no href</a></p>')).toEqual([
			{type: 'text', text: 'See no href'},
		])
	})

	// Block structure (the blank line between paragraphs) lives inside a text
	// segment's own string, not as a separate segment -- two plain paragraphs
	// stay one merged text segment.
	test('adjacent paragraphs merge into one text segment', () => {
		expect(htmlToSegments('<p>One</p><p>Two</p>')).toEqual([{type: 'text', text: 'One\n\nTwo'}])
	})

	// A link segment breaks the run of adjacent text segments, so text either
	// side of it does not merge across it.
	test('a link inside a list item keeps the following item as a separate segment', () => {
		expect(
			htmlToSegments('<ul><li>One <a href="https://x.test">link</a></li><li>Two</li></ul>'),
		).toEqual([
			{type: 'text', text: '• One '},
			{type: 'link', text: 'link', url: 'https://x.test'},
			{type: 'text', text: '• Two'},
		])
	})

	test('an ordered list with no links stays one merged text segment', () => {
		expect(htmlToSegments('<ol><li>One</li><li>Two</li></ol>')).toEqual([
			{type: 'text', text: '1. One\n2. Two'},
		])
	})

	// Blockquote indentation is applied to each segment's own text, so a
	// segment that already starts with a space (from the space before the
	// link) ends up with three leading spaces, not two.
	test('blockquote indentation is applied per segment, including a link segment', () => {
		expect(
			htmlToSegments('<blockquote>Quoted <a href="https://x.test">link</a> text</blockquote>'),
		).toEqual([
			{type: 'text', text: '  Quoted '},
			{type: 'link', text: '  link', url: 'https://x.test'},
			{type: 'text', text: '   text'},
		])
	})

	test('br becomes a newline inside the text segment', () => {
		expect(htmlToSegments('<p>One<br>Two</p>')).toEqual([{type: 'text', text: 'One\nTwo'}])
	})

	test('table elements produce no segments', () => {
		expect(htmlToSegments('<table><tr><td>Cell</td></tr></table>')).toEqual([])
	})

	test('empty input is an empty array', () => {
		expect(htmlToSegments('')).toEqual([])
	})

	test('entities are decoded within a text segment', () => {
		expect(htmlToSegments('<p>Bread &amp; <a href="https://x.test">Butter</a></p>')).toEqual([
			{type: 'text', text: 'Bread & '},
			{type: 'link', text: 'Butter', url: 'https://x.test'},
		])
	})
})
