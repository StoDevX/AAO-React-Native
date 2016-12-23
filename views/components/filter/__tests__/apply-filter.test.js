/* eslint-env jest */
// @flow
import {applyFilter} from '../apply-filters'

it('should return `true` if the fitler is disabled', () => {
  let filter = {
    type: 'list',
    key: 'key',
    enabled: false,
    spec: {label: 'label', options: ['1', '2', '3'], selected: [], mode: 'OR'},
    apply: {key: 'categories'},
  }
  expect(applyFilter(filter, {categories: []})).toBeTruthy()
})
