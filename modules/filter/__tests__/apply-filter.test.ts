import {describe, expect, it} from '@jest/globals'
import {applyFilter} from '../apply-filters'
import {filterValue} from './filter-value.helper'
import type {ListType, ToggleType} from '../types'

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

describe('the two list modes', () => {
	// Two chosen values and an item carrying only one of them is the case that
	// tells the modes apart: OR wants any of the choices, AND wants all of them.
	it('OR matches an item carrying any one of the chosen values', () => {
		expect(applyFilter(listFilter('OR', true, '1', '2'), {categories: ['1']})).toBe(true)
	})

	it('AND does not match an item missing one of the chosen values', () => {
		expect(applyFilter(listFilter('AND', true, '1', '2'), {categories: ['1']})).toBe(false)
	})

	it('AND matches an item carrying every chosen value', () => {
		expect(applyFilter(listFilter('AND', true, '1', '2'), {categories: ['2', '3', '1']})).toBe(true)
	})

	it.each(['OR', 'AND'] as const)(
		'%s does not match an item with none of the chosen values',
		(mode) => {
			expect(applyFilter(listFilter(mode, true, '1'), {categories: ['2', '3']})).toBe(false)
		},
	)
})

describe('a toggle filter', () => {
	type Course = {status?: string; open?: boolean}

	function toggle(trueEquivalent?: string): ToggleType<Course> {
		return {
			type: 'toggle',
			key: 'status',
			enabled: true,
			spec: {label: 'Open Courses', title: 'Status'},
			apply: trueEquivalent ? {key: 'status', trueEquivalent} : {key: 'open'},
		}
	}

	it('matches an item whose value is truthy', () => {
		expect(applyFilter(toggle(), {open: true})).toBe(true)
	})

	it('does not match an item whose value is falsy', () => {
		expect(applyFilter(toggle(), {open: false})).toBe(false)
	})

	// Course search's Open Courses toggle keys on a status letter, where every
	// status is a truthy string and only 'O' means open.
	it('with a true equivalent, matches only an item carrying that value', () => {
		expect(applyFilter(toggle('O'), {status: 'O'})).toBe(true)
		expect(applyFilter(toggle('O'), {status: 'C'})).toBe(false)
	})
})
