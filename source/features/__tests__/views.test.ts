import {existsSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, test} from '@jest/globals'

import {
	HomeViews,
	CUSTOM_SYMBOLS,
	iconImage,
	opensInBrowser,
	viewTarget,
	visibleViews,
	type ViewType,
} from '../views'

describe('the views registry', () => {
	test('no two tiles share a title and a target', () => {
		let keys = HomeViews().map((view) => JSON.stringify([view.title, viewTarget(view)]))

		expect(new Set(keys).size).toBe(keys.length)
	})
})

describe('HomeViews', () => {
	// Written out in full so a change to a tile shows up here.
	test('are the tiles the home screen has always had, in their order', () => {
		let tiles = HomeViews().map((view) => ({
			title: view.title,
			icon: view.icon,
			target: viewTarget(view),
			devOnly: view.devOnly ?? false,
			disabled: view.disabled ?? false,
		}))

		expect(tiles).toEqual([
			{title: 'Menus', icon: 'fork.knife', target: '/menus', devOnly: false, disabled: false},
			{
				title: 'Balances',
				icon: 'arrow.up.right',
				target: 'https://sis.stolaf.edu/sis/index.cfm',
				devOnly: false,
				disabled: false,
			},
			{
				title: 'Balances',
				icon: 'person.text.rectangle.fill',
				target: '/balances',
				devOnly: false,
				disabled: true,
			},
			{title: 'Hours', icon: 'clock.fill', target: '/hours', devOnly: false, disabled: false},
			{title: 'Calendar', icon: 'calendar', target: '/calendar', devOnly: false, disabled: false},
			{
				title: 'Directory',
				icon: 'person.crop.rectangle.fill',
				target: '/directory',
				devOnly: false,
				disabled: false,
			},
			{
				title: 'Streaming Media',
				icon: 'play.rectangle.fill',
				target: '/streaming-media',
				devOnly: false,
				disabled: false,
			},
			{
				title: 'Olaf Messenger',
				icon: 'olaf-messenger',
				target: '/messenger',
				devOnly: false,
				disabled: false,
			},
			{
				title: 'Map',
				icon: 'map.fill',
				target: '/map?campus=stolaf',
				devOnly: false,
				disabled: false,
			},
			{title: 'Transit', icon: 'bus.fill', target: '/transit', devOnly: false, disabled: false},
			{
				title: 'Dictionary',
				icon: 'character.book.closed.fill',
				target: '/dictionary',
				devOnly: false,
				disabled: false,
			},
			{
				title: 'Student Orgs',
				icon: 'person.3.fill',
				target: '/student-orgs',
				devOnly: false,
				disabled: false,
			},
			{
				title: 'More',
				icon: 'ellipsis.circle.fill',
				target: '/more',
				devOnly: false,
				disabled: false,
			},
			{
				title: 'stoPrint',
				icon: 'printer.fill',
				target: '/print-jobs',
				devOnly: false,
				disabled: false,
			},
			{
				title: 'Course Catalog',
				icon: 'graduationcap.fill',
				target: '/course-search',
				devOnly: false,
				disabled: false,
			},
			{
				title: 'Student Work',
				icon: 'briefcase.fill',
				target: '/student-work',
				devOnly: false,
				disabled: false,
			},
			{
				title: 'St. Olaf News',
				icon: 'megaphone.fill',
				target: '/st-olaf-news',
				devOnly: false,
				disabled: false,
			},
			{
				title: 'Athletics',
				icon: 'trophy.fill',
				target: '/athletics',
				devOnly: true,
				disabled: false,
			},
			{
				title: 'Developer',
				icon: 'hammer.fill',
				target: '/developer',
				devOnly: true,
				disabled: false,
			},
		])
	})
})

describe('HomeViews for Carleton', () => {
	let carleton = () => HomeViews('carleton')

	test("are the CARLS app's tiles, in its order and under its names", () => {
		expect(carleton().map((view) => [view.title, viewTarget(view)])).toEqual([
			['Menus', '/carleton-menus'],
			['Workday', 'https://www.carleton.edu/workday/'],
			['Building Hours', '/hours?campus=carleton'],
			['Directory', 'https://www.carleton.edu/directory/'],
			['KRLX', 'radio:krlx'],
			['SUMO', '/carleton-sumo'],
			['The Carletonian', '/carletonian'],
			['Convo', '/carleton-convos'],
			['Campus Map', '/map?campus=carleton'],
			['Moodle', 'https://moodle.carleton.edu/'],
			['Carleton News', '/carleton-news'],
			['Developer', '/developer'],
		])
	})

	test('show every tile but Developer outside dev mode', () => {
		let titles = visibleViews(carleton(), {isDev: false}).map((view) => view.title)

		expect(titles).toHaveLength(carleton().length - 1)
		expect(titles).not.toContain('Developer')
	})

	test("share no target with St. Olaf's tiles but Developer", () => {
		let stOlafTargets = new Set(HomeViews('stolaf').map(viewTarget))
		let shared = carleton()
			.map(viewTarget)
			.filter((target) => stOlafTargets.has(target))

		expect(shared).toEqual(['/developer'])
	})

	test('defaults to St. Olaf', () => {
		expect(HomeViews().map(viewTarget)).toEqual(HomeViews('stolaf').map(viewTarget))
	})
})

describe('opensInBrowser for a station', () => {
	test('is false, since a station opens the Now Playing sheet', () => {
		let krlx = carletonView((v) => v.type === 'radio')
		expect(opensInBrowser(krlx)).toBe(false)
	})
})

function carletonView(matches: (view: ViewType) => boolean): ViewType {
	let found = HomeViews('carleton').filter(matches)
	if (found.length !== 1) {
		throw new Error(`expected one matching view, found ${found.length}`)
	}
	return found[0]
}

describe('visibleViews', () => {
	test('leaves out disabled and dev-only views outside dev mode', () => {
		let titles = visibleViews(HomeViews(), {isDev: false}).map((view) => view.title)

		expect(titles).not.toContain('Athletics')
		expect(titles).not.toContain('Developer')
		expect(titles.filter((title) => title === 'Balances')).toHaveLength(1)
	})

	test('adds the dev-only views in dev mode, after the rest', () => {
		let titles = visibleViews(HomeViews(), {isDev: true}).map((view) => view.title)

		expect(titles.slice(-2)).toEqual(['Athletics', 'Developer'])
	})
})

function onlyView(matches: (view: ViewType) => boolean): ViewType {
	let found = HomeViews().filter(matches)
	if (found.length !== 1) {
		throw new Error(`expected one matching view, found ${found.length}`)
	}
	return found[0]
}

const balancesOnTheWeb = onlyView((v) => v.title === 'Balances' && v.type === 'url')
const balancesScreen = onlyView((v) => v.title === 'Balances' && v.type === 'view')

describe('opensInBrowser', () => {
	test('is true for a web link', () => {
		expect(opensInBrowser(balancesOnTheWeb)).toBe(true)
	})

	test('is false for a native screen', () => {
		expect(opensInBrowser(balancesScreen)).toBe(false)
	})
})

describe('Balances', () => {
	test('opens the SIS landing page on the web', () => {
		expect(balancesOnTheWeb).toMatchObject({
			url: 'https://sis.stolaf.edu/sis/index.cfm',
			icon: 'arrow.up.right',
		})
		expect(balancesOnTheWeb.disabled).toBeFalsy()
	})

	test('keeps the native screen listed, but turned off', () => {
		expect(balancesScreen).toMatchObject({view: '/balances', disabled: true})
	})
})

describe('iconImage', () => {
	test('names an SF Symbol by its system name', () => {
		expect(iconImage('fork.knife')).toEqual({systemName: 'fork.knife'})
	})

	test('names a custom symbol by its asset name', () => {
		expect(iconImage('olaf-messenger')).toEqual({assetName: 'olaf-messenger'})
	})
})

describe('custom symbols', () => {
	test.each(CUSTOM_SYMBOLS)('%s has a symbol set for the asset catalog', (name) => {
		let symbolSet = join(__dirname, '../../../assets/symbols', `${name}.symbolset`, `${name}.svg`)
		expect(existsSync(symbolSet)).toBe(true)
	})
})

describe('Olaf Messenger', () => {
	test("shows the paper's castle", () => {
		expect(onlyView((v) => v.title === 'Olaf Messenger').icon).toBe('olaf-messenger')
	})
})

describe('The Carletonian', () => {
	test("shows the paper's C", () => {
		let tile = HomeViews('carleton').find((v) => v.title === 'The Carletonian')
		expect(tile?.icon).toBe('carletonian')
	})
})
