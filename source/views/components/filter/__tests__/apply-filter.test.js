/* eslint-env jest */
// @flow
import {applyFilter} from '../apply-filters'
import {filterValue} from './filter-value.helper'

it('should return `true` if the filter is disabled', () => {
	let filter = {
		type: 'list',
		key: 'key',
		enabled: false,
		spec: {
			options: filterValue('1', '2', '3'),
			selected: [],
			mode: 'OR',
		},
		apply: {key: 'categories'},
	}
	expect(applyFilter(filter, {categories: []})).toBeTruthy()
})
