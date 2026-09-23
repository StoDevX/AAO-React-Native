import {describe, expect, it} from '@jest/globals'
import {applyFilter} from '../apply-filters'
import {filterValue} from './filter-value.helper'
import type {ListType} from '../types'

type Item = {categories?: unknown}

function listFilter(mode: 'AND' | 'OR', enabled: boolean, ...selected: string[]): ListType<Item> {
	return {
		type: 'list',
		key: 'key',
		enabled,
		spec: {
			title: 'title',
			options: filterValue('1', '2', '3'),
			selected: filterValue(...selected),
			mode,
			displayTitle: true,
		},
		apply: {key: 'categories'},
	}
}

it('should return `true` if the filter is disabled', () => {
	expect(applyFilter(listFilter('OR', false), {categories: []})).toBeTruthy()
})

describe.each(['OR', 'AND'] as const)('an enabled %s list filter', (mode) => {
	it('matches an item carrying the chosen value', () => {
		expect(applyFilter(listFilter(mode, true, '1'), {categories: ['1', '2']})).toBe(true)
	})

	it('matches an item whose object value carries the chosen value', () => {
		expect(applyFilter(listFilter(mode, true, '1'), {categories: {a: '1', b: '2'}})).toBe(true)
	})

	it('does not match an item with an empty array', () => {
		expect(applyFilter(listFilter(mode, true, '1'), {categories: []})).toBe(false)
	})

	it('does not match an item with an empty object', () => {
		expect(applyFilter(listFilter(mode, true, '1'), {categories: {}})).toBe(false)
	})

	// A missing value is an item with no values, not one the filter cannot read.
	it('does not match an item whose value is undefined', () => {
		expect(applyFilter(listFilter(mode, true, '1'), {categories: undefined})).toBe(false)
	})

	it('does not match an item without the key', () => {
		expect(applyFilter(listFilter(mode, true, '1'), {})).toBe(false)
	})

	it('does not match an item whose value is null', () => {
		expect(applyFilter(listFilter(mode, true, '1'), {categories: null})).toBe(false)
	})

	// Course search filters on its numeric `term` and `level` when it fetches,
	// and relies on the list filter leaving a number alone.
	it('lets through an item whose value is a number', () => {
		expect(applyFilter(listFilter(mode, true, '1'), {categories: 2})).toBe(true)
	})
})

describe.each(['OR', 'AND'] as const)('a disabled %s list filter', (mode) => {
	it.each([[[]], [{}], [undefined], [null], [['2']]])(
		'matches an item whose value is %p',
		(value) => {
			expect(applyFilter(listFilter(mode, false, '1'), {categories: value})).toBe(true)
		},
	)
})
