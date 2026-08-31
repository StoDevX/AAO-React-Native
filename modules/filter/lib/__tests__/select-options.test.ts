import {describe, expect, test} from '@jest/globals'
import {clearSelection, toggleOption} from '../select-options'
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

// Both modes share one rule now: an empty selection is the resting state and
// narrows nothing, and ticking is the only thing that turns a filter on.
describe.each(['AND', 'OR'] as const)('toggleOption, %s mode', (mode) => {
	test('adds an option that was not selected', () => {
		let next = toggleOption(listFilter(mode, [{title: 'A'}]), {title: 'C'})
		expect(next.spec.selected).toEqual([{title: 'A'}, {title: 'C'}])
	})

	test('removes an option that was already selected', () => {
		let next = toggleOption(listFilter(mode, [{title: 'A'}, {title: 'B'}]), {title: 'A'})
		expect(next.spec.selected).toEqual([{title: 'B'}])
	})

	test('is enabled once anything is selected', () => {
		expect(toggleOption(listFilter(mode, []), {title: 'A'}).enabled).toBe(true)
	})

	test('is disabled when the last selection is removed', () => {
		let next = toggleOption(listFilter(mode, [{title: 'A'}]), {title: 'A'})
		expect(next.spec.selected).toEqual([])
		expect(next.enabled).toBe(false)
	})

	// Selecting every option is a narrowing like any other, not a disguised
	// resting state -- only an empty selection turns the filter off.
	test('stays enabled when everything ends up selected', () => {
		let next = toggleOption(listFilter(mode, [{title: 'A'}, {title: 'B'}]), {title: 'C'})
		expect(next.spec.selected).toEqual(OPTIONS)
		expect(next.enabled).toBe(true)
	})
})

describe('clearSelection', () => {
	test('empties the selection and disables the filter', () => {
		let next = clearSelection(listFilter('OR', OPTIONS))
		expect(next.spec.selected).toEqual([])
		expect(next.enabled).toBe(false)
	})

	test('leaves an already empty filter alone', () => {
		let next = clearSelection(listFilter('AND', []))
		expect(next.spec.selected).toEqual([])
		expect(next.enabled).toBe(false)
	})
})
