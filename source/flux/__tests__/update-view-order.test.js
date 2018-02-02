/* eslint-env jest */
import {updateViewOrder} from '../parts/homescreen'

test('it should return the current order if no screens have changed', () => {
	let savedOrder = ['a', 'b', 'c']
	let defaultOrder = savedOrder
	let actual = updateViewOrder(savedOrder, defaultOrder)
	let expected = savedOrder
	expect(actual).toEqual(expected)
})

test('it should return the current order if no screens have changed, even if sorted differently', () => {
	let savedOrder = ['c', 'b', 'a']
	let defaultOrder = ['a', 'b', 'c']
	let actual = updateViewOrder(savedOrder, defaultOrder)
	let expected = savedOrder
	expect(actual).toEqual(expected)
})

test('it should return the current order if no screens have changed, even if not sorted alphabetically', () => {
	let savedOrder = ['a', 'b', 'c']
	let defaultOrder = ['c', 'b', 'a']
	let actual = updateViewOrder(savedOrder, defaultOrder)
	let expected = savedOrder
	expect(actual).toEqual(expected)
})

test('it should return the default order if no current order is given', () => {
	let savedOrder = null
	let defaultOrder = ['a', 'b', 'c']
	let actual = updateViewOrder(savedOrder, defaultOrder)
	let expected = defaultOrder
	expect(actual).toEqual(expected)
})

test('it should add new values from the default list', () => {
	let savedOrder = ['b']
	let defaultOrder = ['a', 'b', 'c']
	let actual = updateViewOrder(savedOrder, defaultOrder)
	let expected = ['b', 'a', 'c']
	expect(actual).toEqual(expected)
})

test('it should remove values from the given list when not present in the default list', () => {
	let savedOrder = ['d', 'b']
	let defaultOrder = ['a', 'b', 'c']
	let actual = updateViewOrder(savedOrder, defaultOrder)
	let expected = ['b', 'a', 'c']
	expect(actual).toEqual(expected)
})

test('it should maintain the order of the given items when adding values', () => {
	let savedOrder = ['b']
	let defaultOrder = ['a', 'b', 'c']
	let actual = updateViewOrder(savedOrder, defaultOrder)
	let expected = ['b', 'a', 'c']
	expect(actual).toEqual(expected)
})

test('it should maintain the order of the given items when removing values', () => {
	let savedOrder = ['d', 'b', 'a']
	let defaultOrder = ['a', 'b', 'c']
	let actual = updateViewOrder(savedOrder, defaultOrder)
	let expected = ['b', 'a', 'c']
	expect(actual).toEqual(expected)
})
