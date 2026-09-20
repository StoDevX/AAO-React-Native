import {expect, test} from '@jest/globals'

import type {BusStopStatusEnum} from '../find-bus-stop-status'
import {legsBehindTheBus} from '../legs-behind-the-bus'

const cells = (...statuses: BusStopStatusEnum[]) => statuses.map((stopStatus) => ({stopStatus}))

test('counts the leg the bus is driving as one behind it', () => {
	let route = cells('after', 'after', 'before')
	expect(legsBehindTheBus(route, {targetIndex: 2, progress: 0.5, atStop: false})).toBe(2)
})

test('stops counting at a bus standing at a stop, so the leg out stays faint', () => {
	let route = cells('after', 'at', 'before')
	expect(legsBehindTheBus(route, {targetIndex: 1, progress: 1, atStop: true})).toBe(1)
})

test('counts a stop the route skips as passed when the bus is beyond it', () => {
	// The skipped stop has no arrival time, so its own status says nothing
	// about where the bus is -- both legs touching it are still behind.
	let route = cells('after', 'skip', 'before')
	expect(legsBehindTheBus(route, {targetIndex: 2, progress: 0.5, atStop: false})).toBe(2)
})

test('leaves the whole rail faint before the day starts', () => {
	expect(legsBehindTheBus(cells('before', 'before', 'before'), null)).toBe(0)
})

test('leaves the whole rail solid once the day is over', () => {
	expect(legsBehindTheBus(cells('after', 'after', 'after'), null)).toBe(3)
})

test('reads the last stop the timetable calls passed when no bus is drawn', () => {
	expect(legsBehindTheBus(cells('after', 'after', 'before', 'before'), null)).toBe(2)
})

test('counts nothing on an empty route', () => {
	expect(legsBehindTheBus([], null)).toBe(0)
})
