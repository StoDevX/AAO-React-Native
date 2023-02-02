import {expect, describe, test} from '@jest/globals'
import {applyFilter, applyListFilter} from '../apply-filters'
import {ListFilter, ListMenuItem} from '../types'

function filterValue(...arr: string[]): ListMenuItem[] {
	return arr.map((item) => ({title: item}))
}

describe('when disabled', () => {
	test('should return `true` if the filter is disabled', () => {
		let filter: ListFilter<{categories: string[]}> = {
			type: 'list',
			field: 'categories',
			title: 'title',
			options: filterValue('1', '2', '3'),
			selectedIndices: [],
			mode: 'any',
		}
		expect(applyFilter(filter, {categories: []})).toBeTruthy()
	})
})

describe('when mode="all"', () => {
	test("should return `true` if the item's value is a superset of the needle", () => {
		let data = {items: ['1', '2']}
		let filter: ListFilter<typeof data> = {
			type: 'list',
			field: 'items',
			title: 'title',
			options: filterValue('1'),
			selectedIndices: [0],
			mode: 'all',
		}
		expect(applyListFilter(filter, data)).toBeTruthy()
	})

	test("should return `false` if the item's value is a subset of the needle", () => {
		let data = {items: ['1']}
		let filter: ListFilter<typeof data> = {
			type: 'list',
			field: 'items',
			title: 'title',
			options: filterValue('1', '2', '3'),
			selectedIndices: [0, 1, 2],
			mode: 'all',
		}
		expect(applyListFilter(filter, data)).toBeFalsy()
	})
})

describe('when mode="any"', () => {
	test("should return `true` if the item's value contains the needle", () => {
		let data = {items: ['1']}
		let filter: ListFilter<typeof data> = {
			type: 'list',
			field: 'items',
			title: 'title',
			options: filterValue('1', '2', '3'),
			selectedIndices: [0, 1, 2],
			mode: 'any',
		}
		expect(applyListFilter(filter, data)).toBeTruthy()
	})

	test("should return `false` if the item's value does not contain the needle", () => {
		let data = {items: ['1', '2']}
		let filter: ListFilter<typeof data> = {
			type: 'list',
			field: 'items',
			title: 'title',
			options: filterValue('3'),
			selectedIndices: [0],
			mode: 'any',
		}
		expect(applyListFilter(filter, data)).toBeFalsy()
	})
})
