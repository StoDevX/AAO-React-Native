import {describe, expect, test} from '@jest/globals'
import {toggleAll, toggleOption} from '../select-options'
import type {ListType} from '../../types'

const OPTIONS = [{title: 'A'}, {title: 'B'}, {title: 'C'}]

function listFilter(mode: 'AND' | 'OR', selected: {title: string}[]): ListType<{x: string}> {
	return {
		type: 'list',
		key: 'k',
		enabled: false,
		spec: {title: 'T', options: OPTIONS, selected, mode, displayTitle: true},
		apply: {key: 'x'},
	} as ListType<{x: string}>
}

describe('toggleOption, OR mode', () => {
	// With everything selected the filter shows everything, so tapping one
	// option means "only this one" rather than "all but this one".
	test('narrows to just the tapped option when all were selected', () => {
		let next = toggleOption(listFilter('OR', OPTIONS), {title: 'B'})
		expect(next.spec.selected).toEqual([{title: 'B'}])
	})

	test('removes an option that was already selected', () => {
		let next = toggleOption(listFilter('OR', [{title: 'A'}, {title: 'B'}]), {title: 'A'})
		expect(next.spec.selected).toEqual([{title: 'B'}])
	})

	test('adds an option that was not selected', () => {
		let next = toggleOption(listFilter('OR', [{title: 'A'}]), {title: 'C'})
		expect(next.spec.selected).toEqual([{title: 'A'}, {title: 'C'}])
	})

	// An OR filter selecting everything is the same as no filter at all.
	test('is disabled when everything ends up selected', () => {
		let next = toggleOption(listFilter('OR', [{title: 'A'}, {title: 'B'}]), {title: 'C'})
		expect(next.enabled).toBe(false)
	})

	test('is enabled when only some are selected', () => {
		let next = toggleOption(listFilter('OR', OPTIONS), {title: 'B'})
		expect(next.enabled).toBe(true)
	})
})

describe('toggleOption, AND mode', () => {
	test('is enabled once anything is selected', () => {
		let next = toggleOption(listFilter('AND', []), {title: 'A'})
		expect(next.enabled).toBe(true)
	})

	test('is disabled when the last selection is removed', () => {
		let next = toggleOption(listFilter('AND', [{title: 'A'}]), {title: 'A'})
		expect(next.spec.selected).toEqual([])
		expect(next.enabled).toBe(false)
	})
})

describe('toggleAll', () => {
	test('clears the selection when everything was selected', () => {
		expect(toggleAll(listFilter('OR', OPTIONS)).spec.selected).toEqual([])
	})

	test('selects everything when some were unselected', () => {
		expect(toggleAll(listFilter('OR', [{title: 'A'}])).spec.selected).toEqual(OPTIONS)
	})
})
