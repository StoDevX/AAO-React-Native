import {describe, expect, test} from '@jest/globals'
import {resolveSearch} from '../resolve-search'

describe('resolveSearch', () => {
	test('runs what the reader typed', () => {
		expect(resolveSearch({departmentLink: undefined, typedQuery: 'olaf'})).toEqual({
			query: 'olaf',
			type: 'query',
		})
	})

	test('runs nothing when nobody has typed and no department was linked', () => {
		expect(resolveSearch({departmentLink: undefined, typedQuery: ''})).toEqual({
			query: '',
			type: 'query',
		})
	})

	// An empty field is also how the search bar's cancel button reports itself,
	// so this is the case that decides what cancelling lands the reader on.
	test('runs the linked department while the field is empty', () => {
		expect(resolveSearch({departmentLink: 'Music', typedQuery: ''})).toEqual({
			query: 'Music',
			type: 'department',
		})
	})

	test('runs what the reader typed over the linked department', () => {
		expect(resolveSearch({departmentLink: 'Music', typedQuery: 'olaf'})).toEqual({
			query: 'olaf',
			type: 'query',
		})
	})
})
