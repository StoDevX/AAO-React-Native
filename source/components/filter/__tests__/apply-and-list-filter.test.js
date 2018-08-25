/* eslint-env jest */
// @flow
import {applyAndListFilter} from '../apply-filters'
import {filterValue} from './filter-value.helper'

it("should return `true` if the item's value is a superset of the needle", () => {
	expect(applyAndListFilter(filterValue('1'), ['1', '2'])).toBeTruthy()
})

it("should return `false` if the item's value is a subset of the needle", () => {
	expect(applyAndListFilter(filterValue('1', '2', '3'), ['1'])).toBeFalsy()
})

it('should convert objects into an array of values to act as the value', () => {
	expect(
		applyAndListFilter(filterValue('1', '2'), {key: '1', alt: '2'}),
	).toBeTruthy()
})
