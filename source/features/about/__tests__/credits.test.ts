import {acknowledgements, contributors, inTwoColumns} from '../credits'
import {timeline} from '../timeline'

describe('inTwoColumns', () => {
	it('reads down the left column, then down the right', () => {
		expect(inTwoColumns(['A', 'B', 'C', 'D'])).toEqual([
			['A', 'C'],
			['B', 'D'],
		])
	})

	it('puts the odd name out at the foot of the left column', () => {
		expect(inTwoColumns(['A', 'B', 'C'])).toEqual([['A', 'C'], ['B']])
	})

	it('shows a lone name on a row of its own', () => {
		expect(inTwoColumns(['Hawken Rives'])).toEqual([['Hawken Rives']])
	})
})

describe('credits', () => {
	it('names nobody twice', () => {
		let names = [...contributors, ...acknowledgements]
		expect(new Set(names).size).toBe(names.length)
	})

	it('keeps each list in alphabetical order', () => {
		expect(contributors).toEqual([...contributors].sort())
		expect(acknowledgements).toEqual([...acknowledgements].sort())
	})
})

describe('timeline', () => {
	it('starts with the current version of the app', () => {
		expect(timeline[0]?.period).toMatch(/Today/u)
	})

	it('gives every era a heading and a story', () => {
		for (let era of timeline) {
			expect(era.period).not.toBe('')
			expect(era.story).not.toBe('')
		}
	})
})
