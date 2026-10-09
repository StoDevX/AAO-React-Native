import {describe, expect, test} from '@jest/globals'
import moment from 'moment-timezone'
import {timezone} from '@frogpond/constants'
import {UITEST_FROZEN_DATE} from '@frogpond/timer'

import {findMenu} from '../../../../modules/food-menu/lib/find-menu'
import type {DayPartsCollectionType} from '../../../../modules/food-menu/types'
import recording from '../../campus/__fixtures__/example.college/GET-food-named-menu-treeline-commons.yaml'
import type {EditedBonAppMenuInfoType} from '../types'

type Item = {label: string; special?: number; cor_icon: Record<string, string>; station: string}

const menu = (recording as {json: EditedBonAppMenuInfoType}).json
const dayparts = menu.days[0].cafe.dayparts as unknown as DayPartsCollectionType
const meal = findMenu(dayparts, moment(UITEST_FROZEN_DATE).tz(timezone()))

/// The cor_icon id Bon Appétit keys Vegan under, read off the fixture.
const veganId = Object.entries(menu.cor_icons).find(([, icon]) => icon.label === 'Vegan')?.[0]

function itemsIn(label: string): Item[] {
	let daypart = dayparts[0].find((part) => part.label === label)
	let ids = daypart?.stations.flatMap((station) => station.items) ?? []
	let items = menu.items as unknown as Record<string, Item>
	return ids.map((id) => items[id]).filter(Boolean)
}

function isVegan(item: Item): boolean {
	return veganId !== undefined && Object.keys(item.cor_icon).includes(veganId)
}

/**
 * The Menus and Filter UI tests read this fixture through the app, where a
 * wrong answer shows up as a screenful of food that does not match what a test
 * asked for. These say what it has to keep being true for those tests to mean
 * anything, so an edit that breaks one fails here instead.
 */
describe("Treeline Commons' fixture", () => {
	test('the frozen clock lands in Lunch', () => {
		expect(meal?.label).toBe('Lunch')
	})

	test('Lunch carries Vegan dishes and dishes that are not', () => {
		expect(itemsIn('Lunch').filter(isVegan).length).toBeGreaterThan(0)
		expect(itemsIn('Lunch').filter((item) => !isVegan(item)).length).toBeGreaterThan(0)
	})

	test('Lunch serves a Vegan special, so Specials Only does not empty the list', () => {
		let specials = itemsIn('Lunch').filter((item) => item.special)
		expect(specials.filter(isVegan).length).toBeGreaterThan(0)
	})

	test('Lunch has the two stations and the special the Filter test picks', () => {
		let stations = dayparts[0]
			.find((part) => part.label === 'Lunch')
			?.stations.map((station) => station.label)
		expect(stations).toEqual(expect.arrayContaining(['pizza', 'specialty pizza']))
		expect(itemsIn('Lunch').find((item) => item.label === 'Single Slice')?.special).toBe(1)
	})
})
