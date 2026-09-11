import {describe, expect, test} from '@jest/globals'

import {axisLabel, filterAfterChoosing} from '../picker-state'

describe('axisLabel', () => {
	test('names the axis alone when nothing is filtered', () => {
		expect(axisLabel('category', 'Category', null)).toBe('Category')
	})

	test('names the selection when this axis is the one filtered', () => {
		expect(axisLabel('category', 'Category', {axis: 'category', value: 'Music'})).toBe(
			'Category: Music',
		)
	})

	test('stays bare when the other axis is filtered', () => {
		// Otherwise both rows claim a selection only one of them holds.
		expect(axisLabel('category', 'Category', {axis: 'organization', value: 'Choir'})).toBe(
			'Category',
		)
	})
})

describe('filterAfterChoosing', () => {
	test('narrows to a value nothing was filtered on', () => {
		expect(filterAfterChoosing(null, 'category', 'Music')).toEqual({
			axis: 'category',
			value: 'Music',
		})
	})

	test('clears the filter when the chosen value is the one already on', () => {
		expect(filterAfterChoosing({axis: 'category', value: 'Music'}, 'category', 'Music')).toBeNull()
	})

	test('replaces a value on the same axis', () => {
		expect(filterAfterChoosing({axis: 'category', value: 'Music'}, 'category', 'Chapel')).toEqual({
			axis: 'category',
			value: 'Chapel',
		})
	})

	test('replaces across axes, since there is one selection between them', () => {
		expect(
			filterAfterChoosing({axis: 'category', value: 'Music'}, 'organization', 'Choir'),
		).toEqual({axis: 'organization', value: 'Choir'})
	})

	test('the same value on the other axis is a different selection, not a clear', () => {
		expect(
			filterAfterChoosing({axis: 'category', value: 'Music'}, 'organization', 'Music'),
		).toEqual({axis: 'organization', value: 'Music'})
	})
})
