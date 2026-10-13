import {readdirSync} from 'node:fs'
import path from 'node:path'
import {describe, expect, test} from '@jest/globals'

import {CAMPUS_IDS, campusById} from '../../../campuses'
import {MENU_TABS, cafeTabsOf, menuServerOf, menuTab} from '../menu-tabs'

/** The tabs `app/menus/` has route files for. `index` only gives `/menus` a typed route. */
const ROUTES = readdirSync(path.join(__dirname, '../../../../app/menus'))
	.filter((file) => file.endsWith('.tsx') && file !== '_layout.tsx' && file !== 'index.tsx')
	.map((file) => file.replace(/\.tsx$/u, ''))

describe("Menus' tabs", () => {
	test('are every route under app/menus/, each listed by one campus', () => {
		expect(MENU_TABS.map(({tab}) => tab.name).toSorted()).toEqual(ROUTES.toSorted())
	})

	test.each(CAMPUS_IDS)("on %s are the campus's own cafés, first café first", (campus) => {
		expect(cafeTabsOf(campus).map((tab) => tab.name)).toEqual(
			campusById(campus).menus?.tabs.map((tab) => tab.name) ?? [],
		)
	})

	test('open on the first café, which /menus lands on', () => {
		expect(cafeTabsOf('edu.stolaf')[0].name).toBe('stav-hall')
		expect(cafeTabsOf('edu.carleton')[0].name).toBe('burton')
		expect(cafeTabsOf('example.college')[0].name).toBe('treeline-commons')
	})
})

describe("a café's server", () => {
	test("is Carleton's own for Carleton's halls", () => {
		expect(menuTab('burton').server).toBe('edu.carleton')
		expect(menuServerOf(campusById('edu.carleton'))).toBe('edu.carleton')
	})

	test("is St. Olaf's for St. Olaf's cafés", () => {
		expect(menuTab('stav-hall')).toMatchObject({campus: 'edu.stolaf', server: 'edu.stolaf'})
		expect(menuTab('the-pause').server).toBe('edu.stolaf')
	})

	test('refuses a tab no campus lists', () => {
		expect(() => menuTab('nowhere')).toThrow("No campus's Menus lists a tab named nowhere")
	})
})
