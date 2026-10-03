import {acknowledgements, contributors, formatPeopleList} from '../credits'
import {timeline} from '../timeline'

describe('formatPeopleList', () => {
	it('separates names with a bullet', () => {
		expect(formatPeopleList(['Anna Linden', 'Drew Volz'])).toBe('Anna Linden • Drew Volz')
	})

	it('shows a lone name as it is', () => {
		expect(formatPeopleList(['Hawken Rives'])).toBe('Hawken Rives')
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
