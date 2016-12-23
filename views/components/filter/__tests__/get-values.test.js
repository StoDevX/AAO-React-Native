/* eslint-env jest */
import {getSelectedValuesFromListFilter as getValues} from '../get-values'

const makeListFilter = (options=[], value=[]) => ({
  type: 'list',
  multiple: true,
  key: 'key',
  options: options,
  value: value,
})

it('should return an empty array for a Switch filter', () => {
  let filter = {
    type: 'toggle',
    label: 'label',
    key: 'key',
    value: true,
  }
  expect(getValues(filter)).toEqual([])
})

it('should return an empty array if no filter is passed', () => {
  expect(getValues()).toEqual([])
})

it('should return an array for a List filter', () => {
  let filter = makeListFilter()
  expect(getValues(filter)).toBeInstanceOf(Array)
})

it('should remove selected items from the returned list', () => {
  let filter = makeListFilter(['a', 'b', 'c'], ['b'])
  expect(getValues(filter)).toEqual(['a', 'c'])
})

it("should not return selected items that aren't valid options", () => {
  let filter = makeListFilter(['a', 'b', 'c'], ['d'])
  expect(getValues(filter)).toEqual(['a', 'b', 'c'])
})
