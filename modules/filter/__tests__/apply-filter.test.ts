/* eslint-env jest */
import {applyFilter} from '../apply-filters'
import {filterValue} from './filter-value.helper'
import type {FilterType} from '../types'

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
