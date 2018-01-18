/* eslint-env jest */
// @flow
import {applyToggleFilter} from '../apply-filters'

it('should return `true` if the item has a truthy value', () => {
	let filter = {
		type: 'toggle',
		key: 'key',
		enabled: true,
		spec: {label: 'label'},
		apply: {key: 'i-am-a-key'},
	}
	let item = {'i-am-a-key': true}
	expect(applyToggleFilter(filter, item)).toBeTruthy()
})

it('should return `false` if the item has a falsy value', () => {
	let filter = {
		type: 'toggle',
		key: 'key',
		enabled: true,
		spec: {label: 'label'},
		apply: {key: 'i-am-a-key'},
	}
	let item = {'i-am-a-key': false}
	expect(applyToggleFilter(filter, item)).toBeFalsy()
})

it('should ignore the `enabled` status of the filter', () => {
	let filter = {
		type: 'toggle',
		key: 'key',
		enabled: false,
		spec: {label: 'label'},
		apply: {key: 'i-am-a-key'},
	}
	let itemTrue = {'i-am-a-key': true}
	let itemFalse = {'i-am-a-key': false}
	expect(applyToggleFilter(filter, itemTrue)).toBeTruthy()
	expect(applyToggleFilter(filter, itemFalse)).toBeFalsy()
})
