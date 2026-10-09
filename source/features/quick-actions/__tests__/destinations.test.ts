import {
	DEFAULT_CARLETON_QUICK_ACTIONS,
	DEFAULT_QUICK_ACTIONS,
	MAX_QUICK_ACTIONS,
	quickActionDestinations,
	resolveQuickActions,
} from '../destinations'
import {campusById} from '../../../campuses'

const stolaf = campusById('edu.stolaf')
const carleton = campusById('edu.carleton')

let ids = () => quickActionDestinations(stolaf).map((d) => d.id)

describe('quickActionDestinations', () => {
	test('offers the Stav and Cage menus', () => {
		let byId = new Map(quickActionDestinations(stolaf).map((d) => [d.id, d.href]))
		expect(byId.get('Stav Menu')).toBe('/menus')
		expect(byId.get('Cage Menu')).toBe('/menus/the-cage')
	})

	test('offers no Pause menu', () => {
		expect(quickActionDestinations(stolaf).some((d) => d.href.includes('the-pause'))).toBe(false)
	})

	test('leaves out the bare Menus tile, which Stav Menu already opens', () => {
		expect(ids()).not.toContain('Menus')
		expect(quickActionDestinations(stolaf).filter((d) => d.href === '/menus')).toHaveLength(1)
	})

	test('offers in-app home tiles', () => {
		expect(ids()).toEqual(
			expect.arrayContaining(['Olaf Messenger', 'Transit', 'Calendar', 'Streaming Media']),
		)
	})

	test('leaves out tiles that open a web page, and disabled or dev-only tiles', () => {
		// Balances opens SIS on the web; its native screen is disabled.
		expect(ids()).not.toContain('Balances')
		expect(ids()).not.toContain('Athletics')
		expect(ids()).not.toContain('Developer')
	})

	test('has unique ids', () => {
		expect(new Set(ids()).size).toBe(ids().length)
	})
})

describe('defaults', () => {
	test('fill the four slots', () => {
		expect(DEFAULT_QUICK_ACTIONS).toHaveLength(MAX_QUICK_ACTIONS)
	})

	test('all resolve', () => {
		expect(resolveQuickActions(DEFAULT_QUICK_ACTIONS, stolaf).map((d) => d.id)).toStrictEqual(
			DEFAULT_QUICK_ACTIONS,
		)
	})
})

describe('resolveQuickActions', () => {
	test('keeps the order it is given', () => {
		expect(resolveQuickActions(['Transit', 'Stav Menu'], stolaf).map((d) => d.id)).toStrictEqual([
			'Transit',
			'Stav Menu',
		])
	})

	test('drops unknown ids', () => {
		expect(resolveQuickActions(['Renamed Tile', 'Transit'], stolaf).map((d) => d.id)).toStrictEqual(
			['Transit'],
		)
	})
})

describe('on Carleton', () => {
	let carletonIds = () => quickActionDestinations(carleton).map((d) => d.id)

	test("offers Carleton's in-app tiles, and none of St. Olaf's cafés", () => {
		expect(carletonIds()).toStrictEqual([
			'Menus',
			'Building Hours',
			'Calendar',
			'Important Contacts',
			'SUMO',
			'The Carletonian',
			'Transportation',
			'Convo',
			'Campus Map',
			'Dictionary',
			'Carleton News',
		])
	})

	test('defaults to four picks it offers', () => {
		expect(DEFAULT_CARLETON_QUICK_ACTIONS).toHaveLength(MAX_QUICK_ACTIONS)
		expect(
			resolveQuickActions(DEFAULT_CARLETON_QUICK_ACTIONS, carleton).map((d) => d.id),
		).toStrictEqual(DEFAULT_CARLETON_QUICK_ACTIONS)
	})

	test("drops St. Olaf's picks", () => {
		expect(resolveQuickActions(['Stav Menu', 'SUMO'], carleton).map((d) => d.id)).toStrictEqual([
			'SUMO',
		])
	})
})
