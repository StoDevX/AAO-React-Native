import {evaluateConditions, parseConditionInput} from '../conditions'

const context = {
	platform: 'ios' as const,
	version: '2.8.0',
	now: Date.parse('2024-12-15T12:00:00Z'),
	campus: 'stolaf' as const,
}

describe('condition parser', () => {
	it('parses simple platform conditions', () => {
		let nodes = parseConditionInput([{platform: 'ios'}])
		expect(nodes).toHaveLength(1)
		expect(evaluateConditions(nodes, context)).toBe(true)
	})

	it('parses and evaluates nested groups', () => {
		let nodes = parseConditionInput([
			{
				and: [
					{platform: 'ios'},
					{versionRange: '>=2.0.0'},
					{startDate: '2024-12-01'},
					{endDate: '2024-12-31'},
				],
			},
		])

		expect(nodes).toHaveLength(1)
		expect(evaluateConditions(nodes, context)).toBe(true)
	})

	it('respects date windows', () => {
		let nodes = parseConditionInput([
			{
				startDate: '2025-01-01',
				endDate: '2025-02-01',
			},
		])

		expect(evaluateConditions(nodes, context)).toBe(false)
	})

	it('handles not/or combinations', () => {
		let nodes = parseConditionInput([
			{
				not: {
					or: [{platform: 'android'}, {versionRange: '<2.0.0'}],
				},
			},
		])

		expect(evaluateConditions(nodes, context)).toBe(true)
	})
})

describe('institution conditions', () => {
	it("shows a notice to the institution it names, and not to the other's", () => {
		let nodes = parseConditionInput([{institution: 'carleton'}])
		expect(evaluateConditions(nodes, {...context, campus: 'carleton'})).toBe(true)
		expect(evaluateConditions(nodes, context)).toBe(false)
	})

	it('accepts a list of institutions', () => {
		let nodes = parseConditionInput([{institutions: ['stolaf', 'carleton']}])
		expect(evaluateConditions(nodes, {...context, campus: 'carleton'})).toBe(true)
		expect(evaluateConditions(nodes, context)).toBe(true)
	})

	it('shows a notice naming only an unknown institution to no one', () => {
		let nodes = parseConditionInput([{institution: 'macalester'}])
		expect(evaluateConditions(nodes, context)).toBe(false)
		expect(evaluateConditions(nodes, {...context, campus: 'carleton'})).toBe(false)
	})

	it('combines with the version range', () => {
		let nodes = parseConditionInput([
			{and: [{institution: 'carleton'}, {versionRange: '>=2.9.0-rc.4'}]},
		])
		expect(evaluateConditions(nodes, {...context, campus: 'carleton', version: '2.9.0-rc.4'})).toBe(
			true,
		)
		expect(evaluateConditions(nodes, {...context, campus: 'carleton', version: '2.8.0'})).toBe(
			false,
		)
	})
})
