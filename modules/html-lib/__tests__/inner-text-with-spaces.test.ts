import {innerTextWithSpaces, isTag, parseHtml} from '../index'

describe('innerTextWithSpaces', () => {
	it('returns the text content of an element', () => {
		const doc = parseHtml('<p>Hello world</p>')
		expect(innerTextWithSpaces(doc)).toBe('Hello world')
	})

	it('collapses runs of whitespace, including newlines, into a single space', () => {
		const doc = parseHtml('<p>a\n\n  b</p>')
		expect(innerTextWithSpaces(doc)).toBe('a b')
	})

	it('trims leading and trailing whitespace', () => {
		const doc = parseHtml('  <p>text</p>  ')
		expect(innerTextWithSpaces(doc)).toBe('text')
	})

	it('returns an empty string for whitespace-only or empty content', () => {
		expect(innerTextWithSpaces(parseHtml('<p>   </p>'))).toBe('')
		expect(innerTextWithSpaces(parseHtml(''))).toBe('')
	})

	// Unlike `removeHtml`/`fastGetTrimmedText`, this walks `textContent` directly
	// and does not insert a space where a tag boundary falls between two text
	// runs -- callers that need one (like the ccc-jobs description parser) join
	// per-node results themselves.
	it('does not insert a space between text runs separated only by a tag boundary', () => {
		expect(innerTextWithSpaces(parseHtml('<b>one</b><i>two</i>'))).toBe('onetwo')
		expect(innerTextWithSpaces(parseHtml('<p>one<br>two</p>'))).toBe('onetwo')
	})

	// Also unlike `removeHtml`, script/style bodies are not filtered out --
	// `innerTextWithSpaces` is meant for markup that is already known to be prose.
	it('does not drop script or style bodies', () => {
		expect(innerTextWithSpaces(parseHtml('<script>alert(1)</script>Hi'))).toBe('alert(1)Hi')
		expect(innerTextWithSpaces(parseHtml('<style>p{color:red}</style>Hi'))).toBe('p{color:red}Hi')
	})

	it('decodes character entities', () => {
		expect(innerTextWithSpaces(parseHtml('<p>Bread &amp; Butter</p>'))).toBe('Bread & Butter')
		expect(innerTextWithSpaces(parseHtml('<p>caf&eacute;</p>'))).toBe('café')
	})

	it('works on a single child node, not just the whole document', () => {
		const doc = parseHtml('<p>First</p><p>Second</p>')
		const [first, second] = doc.children
		expect(innerTextWithSpaces(first)).toBe('First')
		expect(innerTextWithSpaces(second)).toBe('Second')
	})

	it('works on a bare text node with no wrapping tag', () => {
		const doc = parseHtml('just text, no tags')
		expect(innerTextWithSpaces(doc.children[0])).toBe('just text, no tags')
	})

	// Mirrors how the ccc-jobs description parser reads a labelled field: the
	// label lives in a bold element nested inside the paragraph being scanned.
	it('reads nested element text the same as the containing element', () => {
		const doc = parseHtml('<p><b>Wage Range:</b> $12.00</p>')
		const [p] = doc.children
		expect(isTag(p)).toBe(true)
		if (!isTag(p)) throw new Error('expected p to be an element')
		expect(innerTextWithSpaces(p)).toBe('Wage Range: $12.00')
		expect(innerTextWithSpaces(p.children[0])).toBe('Wage Range:')
	})
})
