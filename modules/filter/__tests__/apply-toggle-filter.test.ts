import {expect, it} from '@jest/globals'
import {applyToggleFilter} from '../apply-filters'
import type {Filter} from '../types'

it('should return `true` if the item has a truthy value', () => {
	let item = {'i-am-a-key': true}
	let filter: Filter<typeof item> = {
		type: 'toggle',
		key: 'key',
		enabled: true,
		spec: {label: 'label', title: 'title'},
		apply: {key: 'i-am-a-key'},
	}
	expect(applyToggleFilter(filter, item)).toBeTruthy()
})

it('should return `false` if the item has a falsy value', () => {
	let item = {'i-am-a-key': false}
	let filter: Filter<typeof item> = {
		type: 'toggle',
		key: 'key',
		enabled: true,
		spec: {label: 'label', title: 'title'},
		apply: {key: 'i-am-a-key'},
	}
	expect(applyToggleFilter(filter, item)).toBeFalsy()
})

it('should ignore the `enabled` status of the filter', () => {
	let filter: Filter<{'i-am-a-key': boolean}> = {
		type: 'toggle',
		key: 'key',
		enabled: false,
		spec: {label: 'label', title: 'title'},
		apply: {key: 'i-am-a-key'},
	}
	let itemTrue = {'i-am-a-key': true}
	let itemFalse = {'i-am-a-key': false}
	expect(applyToggleFilter(filter, itemTrue)).toBeTruthy()
	expect(applyToggleFilter(filter, itemFalse)).toBeFalsy()
})
