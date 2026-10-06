import {blueGradient} from '@frogpond/colors'
import {
	areaMembership,
	chosenAreaState,
	toAreas,
	UNKNOWN_AREA,
	withUnknownArea,
	type StudentWorkArea,
} from '../areas'

function area(slug: string, units: string[]): StudentWorkArea {
	return {name: slug, slug, icon: 'star', gradient: ['#000', '#fff'], units}
}

const DINING = area('dining', ['22005', '23040'])

describe('areaMembership', () => {
	test('puts each board posting in the areas that list its unit', () => {
		let units = new Map([
			['a', '22005'],
			['b', '23040'],
			['c', '16118'],
		])
		let membership = areaMembership([DINING], units, new Set(['a', 'b', 'c']))

		expect(membership.get('dining')).toEqual({ids: new Set(['a', 'b']), count: 2, empty: false})
	})

	test('leaves out a posting with a null unit', () => {
		let membership = areaMembership([DINING], new Map([['a', null]]), new Set(['a']))

		expect(membership.get('dining')).toEqual({ids: new Set(), count: 0, empty: true})
	})

	test('puts a posting with a null unit in Unknown, and only there', () => {
		let membership = areaMembership(
			withUnknownArea([DINING]),
			new Map([
				['a', null],
				['b', '22005'],
				['c', '99999'],
			]),
			new Set(['a', 'b', 'c']),
		)

		expect(membership.get('unknown')).toEqual({ids: new Set(['a']), count: 1, empty: false})
		expect(membership.get('dining')?.ids).toEqual(new Set(['b']))
	})

	test('leaves a posting with no unit known yet out of Unknown', () => {
		let membership = areaMembership(withUnknownArea([DINING]), new Map(), new Set(['a']))

		expect(membership.get(UNKNOWN_AREA.slug)?.count).toBe(0)
	})

	test('leaves out a unit no area lists', () => {
		let membership = areaMembership([DINING], new Map([['a', '99999']]), new Set(['a']))

		expect(membership.get('dining')?.count).toBe(0)
	})

	test('ignores a mapped posting no longer on the board', () => {
		let membership = areaMembership([DINING], new Map([['gone', '22005']]), new Set())

		expect(membership.get('dining')?.ids.has('gone')).toBe(false)
	})

	test('leaves out a board posting with no unit known yet', () => {
		let membership = areaMembership([DINING], new Map(), new Set(['a']))

		expect(membership.get('dining')?.count).toBe(0)
	})

	test('puts a posting in every area that lists its unit', () => {
		let membership = areaMembership(
			[DINING, area('bonapp', ['22005'])],
			new Map([['a', '22005']]),
			new Set(['a']),
		)

		expect(membership.get('dining')?.ids.has('a')).toBe(true)
		expect(membership.get('bonapp')?.ids.has('a')).toBe(true)
	})
})

describe('withUnknownArea', () => {
	test('appends Unknown once areas have loaded', () => {
		expect(withUnknownArea([DINING])).toEqual([DINING, UNKNOWN_AREA])
	})

	test('adds nothing before they load', () => {
		expect(withUnknownArea([])).toEqual([])
	})
})

describe('chosenAreaState', () => {
	test('is ready when no area is chosen, whatever the units', () => {
		expect(chosenAreaState(null, 'unavailable')).toBe('ready')
		expect(chosenAreaState([], 'loading')).toBe('ready')
	})

	test('follows the units when an area is chosen', () => {
		expect(chosenAreaState(['music'], 'loading')).toBe('loading')
		expect(chosenAreaState(['music'], 'unavailable')).toBe('unavailable')
		expect(chosenAreaState(['music'], 'ready')).toBe('ready')
	})
})

describe('toAreas', () => {
	test('resolves an area’s gradient by name and keeps its units in order', () => {
		let [area] = toAreas([
			{
				name: 'Music',
				slug: 'music',
				icon: 'music.note',
				gradient: 'blue',
				units: ['11230', '11756'],
			},
		])
		expect(area).toEqual({
			name: 'Music',
			slug: 'music',
			icon: 'music.note',
			gradient: blueGradient,
			units: ['11230', '11756'],
		})
	})
})
