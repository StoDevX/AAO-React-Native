import {decay, OPEN_AT, shouldRoar, stageFor, tap} from '../progress'

describe('tap', () => {
	it('adds one', () => {
		expect(tap(0)).toBe(1)
		expect(tap(149)).toBe(150)
	})

	it('stops at open', () => {
		expect(tap(OPEN_AT - 1)).toBe(OPEN_AT)
		expect(tap(OPEN_AT)).toBe(OPEN_AT)
	})
})

describe('decay', () => {
	it('leaves progress alone for the first ten idle seconds', () => {
		expect(decay(100, 0)).toBe(100)
		expect(decay(100, 10)).toBe(100)
	})

	it('takes five taps a second after that', () => {
		expect(decay(100, 11)).toBe(95)
		expect(decay(100, 12)).toBe(90)
		expect(decay(100, 10.5)).toBe(98)
	})

	it('never goes below zero', () => {
		expect(decay(20, 60)).toBe(0)
	})

	it('never sinks an open slab', () => {
		expect(decay(OPEN_AT, 600)).toBe(OPEN_AT)
	})
})

describe('stageFor', () => {
	it.each([
		[0, 'blank'],
		[1, 'tremor'],
		[30, 'tremor'],
		[31, 'edge'],
		[80, 'edge'],
		[81, 'risen'],
		[150, 'risen'],
		[151, 'cracking'],
		[249, 'cracking'],
		[250, 'open'],
	])('puts %i in %s', (progress, stage) => {
		expect(stageFor(progress).stage).toBe(stage)
	})

	it('measures how far through its stage a value is', () => {
		expect(stageFor(0).fraction).toBe(0)
		expect(stageFor(1).fraction).toBeCloseTo(1 / 30)
		expect(stageFor(30).fraction).toBe(1)
		expect(stageFor(31).fraction).toBeCloseTo(1 / 50)
		expect(stageFor(249).fraction).toBe(1)
		expect(stageFor(250).fraction).toBe(1)
	})
})

describe('shouldRoar', () => {
	it('never roars at 30 or below, whatever the draw', () => {
		expect(shouldRoar(1, 0)).toBe(false)
		expect(shouldRoar(30, 0)).toBe(false)
	})

	it('roars past 30 on a draw under one in forty', () => {
		expect(shouldRoar(31, 0)).toBe(true)
		expect(shouldRoar(31, 1 / 40 - 0.0001)).toBe(true)
		expect(shouldRoar(31, 1 / 40)).toBe(false)
		expect(shouldRoar(200, 0.5)).toBe(false)
	})

	it('always roars on opening', () => {
		expect(shouldRoar(OPEN_AT, 0.99)).toBe(true)
	})
})
