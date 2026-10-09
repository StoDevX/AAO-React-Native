import {readdirSync} from 'node:fs'
import path from 'node:path'
import {describe, expect, test} from '@jest/globals'

import {campusById} from '../../../campuses'
import {MENU_TABS, menuCampusOf, menuServerOf, menuTab, menuTabName} from '../menu-tabs'

/** The tabs `app/menus/` has route files for. */
const ROUTES = readdirSync(path.join(__dirname, '../../../../app/menus'))
	.filter((file) => file.endsWith('.tsx') && file !== '_layout.tsx')
	.map((file) => file.replace(/\.tsx$/u, ''))

describe("Menus' tabs", () => {
	test('are every route under app/menus/, each listed by one campus', () => {
		expect(MENU_TABS.map(({tab}) => tab.name).toSorted()).toEqual(ROUTES.toSorted())
	})

	test('name /menus the index tab', () => {
		expect(menuTabName('/menus')).toBe('index')
		expect(menuTabName('/menus/burton/')).toBe('burton')
	})

	test('show the cafés of the campus whose tab is open, whatever the active campus', () => {
		expect(menuCampusOf('/menus', 'edu.carleton')).toBe('edu.stolaf')
		expect(menuCampusOf('/menus/burton', 'edu.stolaf')).toBe('edu.carleton')
	})

	test("show the active campus's under a sheet, which is no café's path", () => {
		expect(menuCampusOf('/menu-item-detail', 'edu.carleton')).toBe('edu.carleton')
	})
})

describe("a café's server", () => {
	test("is Carleton's own for Carleton's halls", () => {
		expect(menuTab('burton').server).toBe('edu.carleton')
		expect(menuServerOf(campusById('edu.carleton'))).toBe('edu.carleton')
	})

	test("is St. Olaf's for St. Olaf's cafés", () => {
		expect(menuTab('index')).toMatchObject({campus: 'edu.stolaf', server: 'edu.stolaf'})
		expect(menuTab('the-pause').server).toBe('edu.stolaf')
	})

	test('refuses a tab no campus lists', () => {
		expect(() => menuTab('nowhere')).toThrow("No campus's Menus lists a tab named nowhere")
	})
})
