import {describe, expect, it} from '@jest/globals'
import variety from '../../__tests__/fixtures/variety-posts.json'
import {parsePoem} from '../poem'

const html = (id: number) => variety.find((p) => p.id === id)?.content.rendered ?? ''
const lineText = (line: {runs: Array<{text: string}>}) => line.runs.map((r) => r.text).join('')

describe('parsePoem', () => {
	it('reads one paragraph per line, with non-breaking-space paragraphs between stanzas', () => {
		let layout = parsePoem(html(36280))
		if (layout.kind !== 'poem') throw new Error('expected a poem')
		expect(layout.stanzas[0]?.map(lineText)[0]).toBe('My bitter yellow comes with me on walks.')
		expect(layout.stanzas[0]).toHaveLength(4)
		expect(layout.stanzas.length).toBeGreaterThan(3)
	})

	it('splits a paragraph at its line breaks', () => {
		let layout = parsePoem('<p>one<br>two<br />three</p>')
		expect(layout).toStrictEqual({
			kind: 'poem',
			stanzas: [
				[
					{indent: 0, runs: [{text: 'one'}]},
					{indent: 0, runs: [{text: 'two'}]},
					{indent: 0, runs: [{text: 'three'}]},
				],
			],
		})
	})

	it('treats a span holding only a non-breaking space as a stanza break', () => {
		let layout = parsePoem(
			'<p>a</p><p>b</p><p><span style="font-weight: 400;">&nbsp;</span></p><p>c</p><p>d</p>',
		)
		if (layout.kind !== 'poem') throw new Error('expected a poem')
		expect(layout.stanzas.map((s) => s.map(lineText))).toStrictEqual([
			['a', 'b'],
			['c', 'd'],
		])
	})

	it('makes one stanza break of several in a row', () => {
		let layout = parsePoem('<p>a</p><p>&nbsp;</p><p><br></p><p>&nbsp;</p><p>b</p>')
		if (layout.kind !== 'poem') throw new Error('expected a poem')
		expect(layout.stanzas).toHaveLength(2)
	})

	it('ranks the distinct leading widths as indent levels', () => {
		let layout = parsePoem('<p>flush</p><p>    four spaces</p><p>' + ' '.repeat(40) + 'deep</p>')
		if (layout.kind !== 'poem') throw new Error('expected a poem')
		expect(layout.stanzas[0]?.map((l) => l.indent)).toStrictEqual([0, 1, 2])
		expect(layout.stanzas[0]?.map(lineText)).toStrictEqual(['flush', 'four spaces', 'deep'])
	})

	it('gives lines of the same width the same level', () => {
		let layout = parsePoem('<p>  a</p><p>' + ' '.repeat(9) + 'b</p><p>  c</p>')
		if (layout.kind !== 'poem') throw new Error('expected a poem')
		expect(layout.stanzas[0]?.map((l) => l.indent)).toStrictEqual([1, 2, 1])
	})

	it('caps the indent at six levels', () => {
		let widths = [0, 1, 2, 3, 4, 5, 6, 7, 8]
		let layout = parsePoem(widths.map((w) => `<p>${' '.repeat(w)}x</p>`).join(''))
		if (layout.kind !== 'poem') throw new Error('expected a poem')
		expect(layout.stanzas[0]?.map((l) => l.indent)).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 6, 6])
	})

	it('counts leading non-breaking spaces as indentation', () => {
		let layout = parsePoem('<p>flush</p><p>&nbsp;&nbsp;&nbsp;&nbsp;in</p>')
		if (layout.kind !== 'poem') throw new Error('expected a poem')
		expect(layout.stanzas[0]?.map((l) => l.indent)).toStrictEqual([0, 1])
	})

	it('collapses runs of spaces after the indent', () => {
		let layout = parsePoem('<p>a   b</p><p>c</p>')
		if (layout.kind !== 'poem') throw new Error('expected a poem')
		expect(layout.stanzas[0]?.map(lineText)).toStrictEqual(['a b', 'c'])
	})

	it('keeps the relative indentation of a real poem', () => {
		// Its indented stanzas sit 28, 26 and 23 spaces in.
		let layout = parsePoem(html(35111))
		if (layout.kind !== 'poem') throw new Error('expected a poem')
		expect(layout.stanzas.map((s) => s[0]?.indent)).toStrictEqual([0, 3, 0, 3, 0, 2, 0, 1])
		expect(layout.stanzas[0]?.map(lineText)[1]).toBe('its light stringing cobwebs')
	})

	it('keeps italics within a line', () => {
		let layout = parsePoem('<p>a <i>gloss</i></p><p>b</p>')
		if (layout.kind !== 'poem') throw new Error('expected a poem')
		expect(layout.stanzas[0]?.[0]?.runs).toStrictEqual([
			{text: 'a '},
			{text: 'gloss', italic: true},
		])
	})

	it('keeps bold and links within a line', () => {
		let layout = parsePoem('<p><b>loud</b> <a href="https://x.test">here</a></p><p>b</p>')
		if (layout.kind !== 'poem') throw new Error('expected a poem')
		expect(layout.stanzas[0]?.[0]?.runs).toStrictEqual([
			{text: 'loud', bold: true},
			{text: ' '},
			{text: 'here', href: 'https://x.test'},
		])
	})

	it('reads an older poem written with line breaks, a stanza per paragraph', () => {
		let layout = parsePoem(html(34824))
		if (layout.kind !== 'poem') throw new Error('expected a poem')
		expect(layout.stanzas.map((s) => s.length)).toStrictEqual([2, 2, 2, 2])
		// The newline WordPress puts after each <br> is not indentation.
		expect(layout.stanzas.flat().every((l) => l.indent === 0)).toBe(true)
		expect(layout.stanzas[0]?.map(lineText)).toStrictEqual([
			'You hadn’t planned to stay but the cold',
			'and my comforter helped you uncover',
		])
	})

	it('makes each paragraph a stanza once any paragraph holds several lines', () => {
		let layout = parsePoem('<p>a<br>b</p><p>c</p><p>&nbsp;</p><p>d</p>')
		if (layout.kind !== 'poem') throw new Error('expected a poem')
		expect(layout.stanzas.map((s) => s.map(lineText))).toStrictEqual([['a', 'b'], ['c'], ['d']])
	})

	it('keeps one-line paragraphs together when the only line breaks are in a blank paragraph', () => {
		let layout = parsePoem(html(36280))
		if (layout.kind !== 'poem') throw new Error('expected a poem')
		expect(layout.stanzas.map((s) => s.length)).toStrictEqual([4, 4, 4, 4, 4])
	})

	it('ignores a trailing paragraph of line breaks', () => {
		let layout = parsePoem(html(36399))
		if (layout.kind !== 'poem') throw new Error('expected a poem')
		expect(layout.stanzas.map((s) => s.map(lineText))).toStrictEqual([
			['Boiling rain on skin', 'Rumbling pipes herald trouble', 'Frigid misery.'],
		])
	})

	it('falls back to an article when text sits outside every paragraph', () => {
		expect(parsePoem('<p>a</p><p>b</p>loose words')).toStrictEqual({kind: 'article'})
	})

	it('ignores whitespace between paragraphs', () => {
		expect(parsePoem('<p>a</p>\n&nbsp;\n<p>b</p>').kind).toBe('poem')
	})

	it('falls back to an article for fewer than two lines', () => {
		expect(parsePoem('<p>only one</p>')).toStrictEqual({kind: 'article'})
	})
})
