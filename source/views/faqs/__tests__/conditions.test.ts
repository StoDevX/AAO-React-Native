import {evaluateConditions, parseConditionInput} from '../conditions'

const context = {
	platform: 'ios' as const,
	version: '2.8.0',
	now: Date.parse('2024-12-15T12:00:00Z'),
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
