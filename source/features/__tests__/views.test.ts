import {existsSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, test} from '@jest/globals'

import {
	AllViews,
	TiledViews,
	CUSTOM_SYMBOLS,
	HOME_GROUPS,
	iconImage,
	homeSections,
	opensInBrowser,
	type ViewType,
} from '../views'

describe('the views registry', () => {
	test('every view has an id of its own', () => {
		let ids = AllViews().map((view) => view.id)

		expect(new Set(ids).size).toBe(ids.length)
	})

	test('every view belongs to a group home draws', () => {
		let groups = new Set(HOME_GROUPS.map((group) => group.id))

		for (let view of AllViews()) {
			expect(groups).toContain(view.group)
		}
	})

	test('Help is the only group that cannot collapse', () => {
		let fixed = HOME_GROUPS.filter((group) => !group.collapsible).map((group) => group.id)

		expect(fixed).toEqual(['help'])
	})
})

describe('TiledViews', () => {
	// The tiled home is today's: one Menus tile and one Streaming Media tile,
	// which tab between their cafes and stations, and none of the tiles the
	// grouped home adds. Written out in full so a change to a grouped tile that
	// the tiled home inherits shows up here.
	test('are the tiles the home screen has always had, in their order', () => {
		let tiles = TiledViews().map((view) => ({
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
		])
	})
})

describe('homeSections', () => {
	test('draws the groups in their fixed order', () => {
		let order = homeSections(AllViews(), {isDev: false}).map((section) => section.id)

		expect(order).toEqual([
			'eat',
			'get-around',
			'classes-work',
			'whats-on',
			'listen-watch',
			'just-for-fun',
			'help',
			'campus-communications',
		])
	})

	test('leaves out the Dev group outside dev mode', () => {
		let ids = homeSections(AllViews(), {isDev: false}).flatMap((section) =>
			section.views.map((view) => view.id),
		)

		expect(ids).not.toContain('carleton-campus')
		expect(ids).not.toContain('carleton-menus')
	})

	test('adds the Dev group, last, in dev mode', () => {
		let sections = homeSections(AllViews(), {isDev: true})

		expect(sections.at(-1)?.id).toBe('dev')
	})

	test('shows Athletics outside dev mode', () => {
		let whatsOn = homeSections(AllViews(), {isDev: false}).find(
			(section) => section.id === 'whats-on',
		)

		expect(whatsOn?.views.map((view) => view.id)).toContain('athletics')
	})

	test('drops a disabled view, and a group it leaves empty', () => {
		let views = AllViews().map((view) =>
			view.group === 'just-for-fun' ? {...view, disabled: true} : view,
		)

		let ids = homeSections(views, {isDev: false}).map((section) => section.id)

		expect(ids).not.toContain('just-for-fun')
	})
})

function onlyView(matches: (view: ViewType) => boolean): ViewType {
	let found = AllViews().filter(matches)
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
