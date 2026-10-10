import {describe, expect, test} from '@jest/globals'

import {campusById} from '../../../campuses'
import type {CampusDefinition} from '../../../campuses'
import {MAX_QUICK_ACTIONS, quickActionDestinations, resolveQuickActions} from '../destinations'

const stolaf = campusById('edu.stolaf')
const carleton = campusById('edu.carleton')

let ids = (campus: CampusDefinition = stolaf) => quickActionDestinations(campus).map((d) => d.id)

describe('quickActionDestinations', () => {
	test("offers St. Olaf's café menus first, from its menus section", () => {
		expect(quickActionDestinations(stolaf).slice(0, 2)).toStrictEqual([
			{id: 'Stav Menu', title: 'Stav Menu', icon: 'fork.knife', href: '/menus/stav-hall'},
			{id: 'Cage Menu', title: 'Cage Menu', icon: 'cup.and.saucer.fill', href: '/menus/the-cage'},
		])
	})

	test('offers no Pause menu', () => {
		expect(quickActionDestinations(stolaf).some((d) => d.href.includes('the-pause'))).toBe(false)
	})

	test('leaves out the bare Menus tile, which lands on Stav Hall as Stav Menu does', () => {
		expect(ids()).not.toContain('Menus')
	})

	test('offers the bare Menus tile on a campus with no café actions', () => {
		expect(ids(carleton)).toContain('Menus')
	})

	test('offers in-app home tiles', () => {
		expect(ids()).toEqual(
			expect.arrayContaining(['Olaf Messenger', 'Transit', 'Calendar', 'Streaming Media']),
		)
	})

	test('leaves out tiles that open a web page, and disabled or dev-only tiles', () => {
		expect(ids()).not.toContain('Balances')
		expect(ids()).not.toContain('Athletics')
		expect(ids()).not.toContain('Developer')
	})

	test.each([stolaf, carleton])('has unique ids on $id', (campus) => {
		expect(new Set(ids(campus)).size).toBe(ids(campus).length)
	})
})

describe.each([stolaf, carleton])("$id's defaults", (campus) => {
	test('fill the four slots', () => {
		expect(campus.quickActions?.defaults).toHaveLength(MAX_QUICK_ACTIONS)
	})

	test('all resolve', () => {
		let defaults = campus.quickActions?.defaults ?? []
		expect(resolveQuickActions(defaults, campus).map((d) => d.id)).toStrictEqual(defaults)
	})
})

test("St. Olaf's defaults are the ones it shipped with", () => {
	expect(stolaf.quickActions?.defaults).toStrictEqual([
		'Stav Menu',
		'Cage Menu',
		'Olaf Messenger',
		'Transit',
	])
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
	test("offers Carleton's in-app tiles, and none of St. Olaf's cafés", () => {
		expect(ids(carleton)).toStrictEqual([
			'Menus',
			'Building Hours',
			'Calendar',
			'Directory',
			'SUMO',
			'The Carletonian',
			'Transportation',
			'Convo',
			'Campus Map',
			'Dictionary',
			'Carleton News',
		])
	})

	test('starts from the CARLS picks', () => {
		expect(carleton.quickActions?.defaults).toStrictEqual([
			'Menus',
			'Building Hours',
			'SUMO',
			'Convo',
		])
	})

	test("drops St. Olaf's picks", () => {
		expect(resolveQuickActions(['Stav Menu', 'SUMO'], carleton).map((d) => d.id)).toStrictEqual([
			'SUMO',
		])
	})
})
