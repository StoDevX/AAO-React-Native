import {describe, expect, test} from '@jest/globals'

import {angleAround, isTap, releaseVelocity, turnBetween} from '../record-gesture'

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

describe('releaseVelocity', () => {
	test('is the turn rate, in degrees per second, of a steady scratch', () => {
		let samples = [
			{angle: 0, time: 0},
			{angle: 10, time: 20},
			{angle: 20, time: 40},
			{angle: 30, time: 60},
		]
		expect(releaseVelocity(samples, 60)).toBeCloseTo(500)
	})

	test('goes the short way across the seam at nine o’clock', () => {
		let samples = [
			{angle: 170, time: 0},
			{angle: -175, time: 20},
			{angle: -160, time: 40},
		]
		expect(releaseVelocity(samples, 40)).toBeCloseTo(750)
	})

	test('is zero when the finger stopped before it lifted', () => {
		let samples = [
			{angle: 0, time: 0},
			{angle: 30, time: 60},
		]
		expect(releaseVelocity(samples, 300)).toBe(0)
	})

	test('reflects how the scratch ended, not how it began', () => {
		let samples = [
			{angle: 0, time: 0},
			{angle: 90, time: 50},
			{angle: 180, time: 100},
			{angle: 181, time: 200},
			{angle: 182, time: 250},
		]
		expect(releaseVelocity(samples, 250)).toBeCloseTo(20)
	})

	test('is zero with too little to measure', () => {
		expect(releaseVelocity([], 0)).toBe(0)
		expect(releaseVelocity([{angle: 10, time: 0}], 0)).toBe(0)
	})
})
