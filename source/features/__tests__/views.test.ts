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
	// grouped home adds.
	test('are the tiles the home screen has always had, in their order', () => {
		expect(TiledViews().map((view) => view.title)).toEqual([
			'Menus',
			'Balances',
			'Balances',
			'Hours',
			'Calendar',
			'Directory',
			'Streaming Media',
			'Olaf Messenger',
			'Map',
			'Transit',
			'Dictionary',
			'Student Orgs',
			'More',
			'stoPrint',
			'Course Catalog',
			'Student Work',
			'St. Olaf News',
			'Athletics',
			'Carleton Campus',
		])
	})

	test('keep Athletics and Carleton Campus to dev mode', () => {
		let devOnly = TiledViews()
			.filter((view) => view.devOnly)
			.map((view) => view.title)

		expect(devOnly).toEqual(['Athletics', 'Carleton Campus'])
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
