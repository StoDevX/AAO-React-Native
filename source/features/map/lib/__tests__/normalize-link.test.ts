import {expect, it} from '@jest/globals'
import {normalizeLinks} from '../normalize-link'

it('splits a well-formed "Label <url>" string into label and href', () => {
	expect(normalizeLinks(['Registrar <https://wp.stolaf.edu/registrar>'])).toEqual([
		{label: 'Registrar', href: 'https://wp.stolaf.edu/registrar'},
	])
})

it('carries a label-only string through with an empty href', () => {
	expect(normalizeLinks(['Just a label, no link'])).toEqual([
		{label: 'Just a label, no link', href: ''},
	])
})

it('passes a St. Olaf {label, href} object through unchanged', () => {
	expect(normalizeLinks([{label: 'Admissions', href: 'https://wp.stolaf.edu/admissions'}])).toEqual(
		[{label: 'Admissions', href: 'https://wp.stolaf.edu/admissions'}],
	)
})

it('normalises a mix of strings and objects in the same list', () => {
	expect(
		normalizeLinks([
			'Registrar <https://wp.stolaf.edu/registrar>',
			{label: 'Admissions', href: 'https://wp.stolaf.edu/admissions'},
		]),
	).toEqual([
		{label: 'Registrar', href: 'https://wp.stolaf.edu/registrar'},
		{label: 'Admissions', href: 'https://wp.stolaf.edu/admissions'},
	])
})

it('returns an empty list for an empty list', () => {
	expect(normalizeLinks([])).toEqual([])
})

it('returns an empty list when the field is absent', () => {
	expect(normalizeLinks(undefined)).toEqual([])
})
