import {describe, expect, test} from '@jest/globals'
import {calculateBusProgress} from '../calculate-bus-progress'
import {time} from './moment.helper'

describe('calculateBusProgress', () => {
	test('returns 0 when now equals previousStopDeparture', () => {
		let previous = time('1:00pm')
		let next = time('1:10pm')
		let now = time('1:00pm')

		let result = calculateBusProgress(previous, next, now)

		expect(result).toBe(0)
	})

	test('returns 1 when now equals nextStopArrival', () => {
		let previous = time('1:00pm')
		let next = time('1:10pm')
		let now = time('1:10pm')

		let result = calculateBusProgress(previous, next, now)

		expect(result).toBe(1)
	})

	test('returns 0.5 when now is halfway between the two stops', () => {
		let previous = time('1:00pm')
		let next = time('1:10pm')
		let now = time('1:05pm')

		let result = calculateBusProgress(previous, next, now)

		expect(result).toBe(0.5)
	})

	test('clamps to 0 when now is before previousStopDeparture', () => {
		let previous = time('1:00pm')
		let next = time('1:10pm')
		let now = time('12:55pm')

		let result = calculateBusProgress(previous, next, now)

		expect(result).toBe(0)
	})

	test('clamps to 1 when now is after nextStopArrival', () => {
		let previous = time('1:00pm')
		let next = time('1:10pm')
		let now = time('1:15pm')

		let result = calculateBusProgress(previous, next, now)

		expect(result).toBe(1)
	})

	test('returns 0 when previousStopDeparture and nextStopArrival are the same time', () => {
		let previous = time('1:00pm')
		let next = time('1:00pm')
		let now = time('1:00pm')

		let result = calculateBusProgress(previous, next, now)

		expect(result).toBe(0)
	})
})
