import {expect, test} from '@jest/globals'

import {stripAnchorIndex} from '../strip-anchor-index'

test('opens on the stop the bus has just left', () => {
	expect(stripAnchorIndex({targetIndex: 7, progress: 0.4, atStop: false}, 6)).toBe(6)
})

test('opens on the stop the bus is sitting at', () => {
	expect(stripAnchorIndex({targetIndex: 3, progress: 1, atStop: true}, 3)).toBe(3)
})

test('stays on the first stop while the bus is on the leg into it', () => {
	expect(stripAnchorIndex({targetIndex: 0, progress: 0.5, atStop: false}, 0)).toBe(0)
})

test('opens on the stop the timetable calls current when no bus is out', () => {
	expect(stripAnchorIndex(null, 4)).toBe(4)
})

test('has nowhere to open when the route has no current stop', () => {
	expect(stripAnchorIndex(null, null)).toBeNull()
})
