import {expect, test} from '@jest/globals'

import {collapseEarlierStops} from '../collapse-earlier-stops'

test('hides the stops the bus has already left', () => {
	expect(collapseEarlierStops({targetIndex: 5, expanded: false})).toStrictEqual({
		firstVisibleIndex: 4,
		hiddenCount: 4,
	})
})

test('keeps the stop behind the bus on screen, so its leg has both ends', () => {
	let {firstVisibleIndex} = collapseEarlierStops({targetIndex: 5, expanded: false})
	expect(firstVisibleIndex).toBe(4)
})

test('hides nothing when only one stop would go behind the row', () => {
	expect(collapseEarlierStops({targetIndex: 2, expanded: false})).toStrictEqual({
		firstVisibleIndex: 0,
		hiddenCount: 0,
	})
})

test('collapses as soon as the row saves a row', () => {
	expect(collapseEarlierStops({targetIndex: 3, expanded: false})).toStrictEqual({
		firstVisibleIndex: 2,
		hiddenCount: 2,
	})
})

test('hides nothing when the bus is heading for the second stop', () => {
	expect(collapseEarlierStops({targetIndex: 1, expanded: false})).toStrictEqual({
		firstVisibleIndex: 0,
		hiddenCount: 0,
	})
})

test('hides nothing when the bus is heading for the first stop', () => {
	expect(collapseEarlierStops({targetIndex: 0, expanded: false})).toStrictEqual({
		firstVisibleIndex: 0,
		hiddenCount: 0,
	})
})

test('hides nothing when the bus is not on the route', () => {
	expect(collapseEarlierStops({targetIndex: null, expanded: false})).toStrictEqual({
		firstVisibleIndex: 0,
		hiddenCount: 0,
	})
})

test('shows every stop once the reader opens it up', () => {
	expect(collapseEarlierStops({targetIndex: 9, expanded: true})).toStrictEqual({
		firstVisibleIndex: 0,
		hiddenCount: 0,
	})
})
