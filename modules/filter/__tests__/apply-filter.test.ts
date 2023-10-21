import {applyFilter} from '../apply-filters'
import type {FilterType} from '../types'
import {filterValue} from './filter-value.helper'
import {expect, it} from '@jest/globals'

it('should return `true` if the filter is disabled', () => {
	let filter: FilterType<{categories: string[]}> = {
		type: 'list',
		key: 'key',
		enabled: false,
		spec: {
			title: 'title',
			options: filterValue('1', '2', '3'),
			selected: [],
			mode: 'OR',
			displayTitle: true,
		},
		apply: {key: 'categories'},
	}
	expect(applyFilter(filter, {categories: []})).toBeTruthy()
})
