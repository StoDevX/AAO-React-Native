import {
	areaMembership,
	chosenAreaState,
	type AreaStatus,
	type StudentWorkArea,
	type UnitResult,
} from '../areas'

function area(slug: string, units: string[]): StudentWorkArea {
	return {name: slug, slug, icon: 'star', gradient: ['#000', '#fff'], units}
}

const BOARD = new Set(['a', 'b', 'c', 'd'])

function results(entries: Array<[string, UnitResult]>): Map<string, UnitResult> {
	return new Map(entries)
}

describe('areaMembership', () => {
	test('counts an area whose searches all found postings', () => {
		let status = areaMembership(
			[area('music', ['1', '2'])],
			results([
				['1', {status: 'success', ids: ['a']}],
				['2', {status: 'success', ids: ['b']}],
			]),
			BOARD,
		).get('music')
		expect(status).toEqual({ids: new Set(['a', 'b']), count: 2, empty: false, settled: true})
	})

	test('calls an area empty only when every search answered with nothing', () => {
		let status = areaMembership(
			[area('art', ['1'])],
			results([['1', {status: 'success', ids: []}]]),
			BOARD,
		).get('art')
		expect(status).toEqual({ids: new Set(), count: 0, empty: true, settled: true})
	})

	test('counts what loaded when one of an area’s searches failed', () => {
		let status = areaMembership(
			[area('music', ['1', '2'])],
			results([
				['1', {status: 'success', ids: ['a']}],
				['2', {status: 'error'}],
			]),
			BOARD,
		).get('music')
		expect(status).toEqual({ids: new Set(['a']), count: 1, empty: false, settled: true})
	})

	test('never calls an area empty when its searches failed', () => {
		let status = areaMembership(
			[area('music', ['1'])],
			results([['1', {status: 'error'}]]),
			BOARD,
		).get('music')
		expect(status).toEqual({ids: new Set(), count: undefined, empty: false, settled: true})
	})

	test('shows no count before any search answers', () => {
		let status = areaMembership(
			[area('music', ['1'])],
			results([['1', {status: 'pending'}]]),
			BOARD,
		).get('music')
		expect(status).toEqual({ids: new Set(), count: undefined, empty: false, settled: false})
	})

	test('counts a posting once when two of an area’s units return it', () => {
		let status = areaMembership(
			[area('dance', ['1', '2'])],
			results([
				['1', {status: 'success', ids: ['a']}],
				['2', {status: 'success', ids: ['a']}],
			]),
			BOARD,
		).get('dance')
		expect(status?.count).toBe(1)
	})

	// A unit search can briefly know a posting the board has not caught up to,
	// or one it has dropped; only the board's postings are shown or counted.
	test('ignores IDs that are not on the board', () => {
		let status = areaMembership(
			[area('music', ['1'])],
			results([['1', {status: 'success', ids: ['a', 'gone']}]]),
			BOARD,
		).get('music')
		expect(status?.ids).toEqual(new Set(['a']))
	})
})

describe('chosenAreaState', () => {
	const MUSIC = area('music', ['1'])

	function status(overrides: Partial<AreaStatus>): Map<string, AreaStatus> {
		return new Map([
			['music', {ids: new Set(), count: undefined, empty: false, settled: false, ...overrides}],
		])
	}

	test('is ready with no area chosen', () => {
		expect(chosenAreaState(null, [MUSIC], status({}), false)).toBe('ready')
	})

	test('is ready once the chosen area is known', () => {
		expect(chosenAreaState(['music'], [MUSIC], status({count: 2, settled: true}), false)).toBe(
			'ready',
		)
	})

	// Showing the whole board while an area loads would pass it off as the area's.
	test('waits while the chosen area’s searches are pending', () => {
		expect(chosenAreaState(['music'], [MUSIC], status({}), false)).toBe('loading')
	})

	test('fails when every search for the chosen area failed', () => {
		expect(chosenAreaState(['music'], [MUSIC], status({settled: true}), false)).toBe('failed')
	})

	// A list that fills in unit by unit would jump back to the top each time.
	test('waits for every search when some have answered', () => {
		expect(chosenAreaState(['music'], [MUSIC], status({count: 1, settled: false}), false)).toBe(
			'loading',
		)
	})

	// Try Again: show that it is trying rather than the same failure.
	test('shows a retry of failed searches as loading', () => {
		expect(chosenAreaState(['music'], [MUSIC], status({settled: true}), true)).toBe('loading')
	})
})
