/* eslint-env jest */
// @flow
import {applyOrListFilter} from '../apply-filters'
import {filterValue} from './filter-value.helper'

it("should return `true` if the item's value contains the needle", () => {
	expect(applyOrListFilter(filterValue('1', '2', '3'), '1')).toBeTruthy()
})

it("should return `false` if the item's value does not contain the needle", () => {
	expect(applyOrListFilter(filterValue('1', '2', '3'), '-1')).toBeFalsy()
})
