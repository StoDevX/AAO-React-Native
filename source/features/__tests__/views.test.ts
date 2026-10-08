import {existsSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, test} from '@jest/globals'

import {
	HomeViews,
	CUSTOM_SYMBOLS,
	iconImage,
	opensInBrowser,
	visibleViews,
	type ViewType,
} from '../views'

describe('the views registry', () => {
	test('no two tiles share a title and a target', () => {
		let keys = HomeViews().map((view) =>
			JSON.stringify([view.title, view.type === 'view' ? view.view : view.url]),
		)

		expect(new Set(keys).size).toBe(keys.length)
	})
})

describe('HomeViews', () => {
	// Written out in full so a change to a tile shows up here.
	test('are the tiles the home screen has always had, in their order', () => {
		let tiles = HomeViews().map((view) => ({
			title: view.title,
			icon: view.icon,
			target: view.type === 'view' ? view.view : view.url,
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
				title: 'Carleton Campus',
				icon: 'building.2.fill',
				target: '/hours?campus=carleton',
				devOnly: true,
				disabled: false,
			},
			{
				title: 'Carleton SUMO',
				icon: 'film.fill',
				target: '/carleton-sumo',
				devOnly: true,
				disabled: false,
			},
			{
				title: 'Carleton Convo',
				icon: 'building.columns.fill',
				target: '/carleton-convos',
				devOnly: true,
				disabled: false,
			},
			{
				title: 'Carleton Directory',
				icon: 'person.crop.rectangle.fill',
				target: 'https://www.carleton.edu/directory/',
				devOnly: true,
				disabled: false,
			},
			{
				title: 'Carleton Moodle',
				icon: 'graduationcap.fill',
				target: 'https://moodle.carleton.edu/',
				devOnly: true,
				disabled: false,
			},
			{
				title: 'Carleton Workday',
				icon: 'briefcase.fill',
				target: 'https://www.carleton.edu/workday/',
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

describe('visibleViews', () => {
	test('leaves out disabled and dev-only views outside dev mode', () => {
		let titles = visibleViews(HomeViews(), {isDev: false}).map((view) => view.title)

		expect(titles).not.toContain('Athletics')
		expect(titles).not.toContain('Developer')
		expect(titles.filter((title) => title === 'Balances')).toHaveLength(1)
	})

	test('adds the dev-only views in dev mode, after the rest', () => {
		let titles = visibleViews(HomeViews(), {isDev: true}).map((view) => view.title)

		expect(titles.slice(-8)).toEqual([
			'Athletics',
			'Carleton Campus',
			'Carleton SUMO',
			'Carleton Convo',
			'Carleton Directory',
			'Carleton Moodle',
			'Carleton Workday',
			'Developer',
		])
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
