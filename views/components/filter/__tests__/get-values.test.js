/* eslint-env jest */
import {getSelectedValuesFromListFilter as getValues} from '../get-values'

const makeChecklistFilter = ({options=[], value=[]}={}) => ({
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
  let filter = makeChecklistFilter()
  expect(getValues(filter)).toBeInstanceOf(Array)
})
