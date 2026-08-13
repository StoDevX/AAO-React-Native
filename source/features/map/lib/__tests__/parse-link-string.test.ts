import {expect, it} from '@jest/globals'
import {parseLinkString} from '../parse-link-string'

it('parses a well-formed label-and-url string', () => {
	let result = parseLinkString('Registrar <https://wp.stolaf.edu/registrar>')
	expect(result).toEqual({
		label: 'Registrar',
		href: 'https://wp.stolaf.edu/registrar',
	})
})

it('handles a label containing spaces and punctuation', () => {
	let result = parseLinkString(
		"Dean's Office <https://wp.stolaf.edu/dean's-office>",
	)
	expect(result).toEqual({
		label: "Dean's Office",
		href: "https://wp.stolaf.edu/dean's-office",
	})
})

it('returns the whole string as the label and an empty href when no <…> wrap is present', () => {
	let result = parseLinkString('Just a label, no link')
	expect(result).toEqual({label: 'Just a label, no link', href: ''})
})

it('returns empty label and empty href for an empty string', () => {
	let result = parseLinkString('')
	expect(result).toEqual({label: '', href: ''})
})
