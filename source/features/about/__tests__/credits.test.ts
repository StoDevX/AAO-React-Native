import {creditRows, inTwoColumns} from '../credits'

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

describe('creditRows', () => {
	it('sets names in two columns at ordinary text sizes', () => {
		expect(creditRows(['A', 'B'], 1)).toEqual([['A', 'B']])
	})

	it('gives each name its own row at the accessibility sizes', () => {
		expect(creditRows(['A', 'B'], 1.65)).toEqual([['A'], ['B']])
	})
})
