import {describe, expect, test} from '@jest/globals'

import {angleAround, isTap, turnBetween} from '../record-gesture'

describe('isTap', () => {
	test('a finger that barely moved is a tap', () => {
		expect(isTap(0, 0)).toBe(true)
		expect(isTap(6, 7)).toBe(true)
	})

	test('a finger that moved 10pt or more is a scrub', () => {
		expect(isTap(10, 0)).toBe(false)
		expect(isTap(8, 8)).toBe(false)
	})
})

describe('angleAround', () => {
	const centre = {x: 100, y: 100}

	test('measures clockwise on screen, from three o’clock', () => {
		expect(angleAround(centre, {x: 150, y: 100})).toBeCloseTo(0)
		expect(angleAround(centre, {x: 100, y: 150})).toBeCloseTo(90)
		expect(angleAround(centre, {x: 50, y: 100})).toBeCloseTo(180)
		expect(angleAround(centre, {x: 100, y: 50})).toBeCloseTo(-90)
	})
})

describe('turnBetween', () => {
	test('is the signed difference for a small turn', () => {
		expect(turnBetween(10, 30)).toBeCloseTo(20)
		expect(turnBetween(30, 10)).toBeCloseTo(-20)
	})

	test('goes the short way across the seam at nine o’clock', () => {
		expect(turnBetween(170, -170)).toBeCloseTo(20)
		expect(turnBetween(-170, 170)).toBeCloseTo(-20)
	})
})
