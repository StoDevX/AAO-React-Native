import moment from 'moment-timezone'
import {timezone} from '@frogpond/constants'
import {UITEST_FROZEN_DATE} from '@frogpond/timer'
import {findMenu} from '../../../../modules/food-menu/lib/find-menu'
import type {DayPartsCollectionType} from '../../../../modules/food-menu/types'
import {bonAppMenuOptions} from '../query'
import fixture from '../fixtures/uitest-stav-menu.json'

/// What the Menus screen would compute from the fixture on a UI test run.
const dayparts = fixture.days[0].cafe.dayparts as unknown as DayPartsCollectionType
const frozen = moment(UITEST_FROZEN_DATE).tz(timezone())
const meal = findMenu(dayparts, frozen)

/// The cor_icon id Bon Appetit keys Vegan under, read off the fixture rather
/// than hardcoded, since a re-capture could renumber it.
const veganId = Object.entries(fixture.cor_icons).find(([, icon]) => icon.label === 'Vegan')?.[0]

function itemsIn(label: string): {special?: boolean; cor_icon: Record<string, string>}[] {
	let daypart = dayparts[0].find((part) => part.label === label)
	let ids = daypart?.stations.flatMap((station) => station.items) ?? []
	let items = fixture.items as unknown as Record<
		string,
		{special?: boolean; cor_icon: Record<string, string>}
	>
	return ids.map((id) => items[id]).filter(Boolean)
}

function isVegan(item: {cor_icon: Record<string, string>}): boolean {
	return veganId != null && Object.keys(item.cor_icon || {}).includes(veganId)
}

/**
 * The UI tests read this fixture through the app, where a wrong answer shows up
 * as a screenful of food that does not match what a test asked for. These
 * assertions say what the fixture has to keep being true for those tests to
 * mean anything, so a re-capture that breaks one fails here instead.
 */
describe('the Stav Hall UI test fixture', () => {
	test('the frozen clock lands in Lunch', () => {
		expect(meal?.label).toBe('Lunch')
	})

	test('Lunch carries the Vegan mark the filter tests choose', () => {
		expect(veganId).toBeDefined()
		expect(itemsIn('Lunch').filter(isVegan).length).toBeGreaterThan(0)
	})

	test('Lunch also carries dishes that are not Vegan, so the filter has work to do', () => {
		expect(itemsIn('Lunch').filter((item) => !isVegan(item)).length).toBeGreaterThan(0)
	})

	test('Lunch serves a Vegan special, so Specials Only does not empty the list', () => {
		let specials = itemsIn('Lunch').filter((item) => item.special)
		expect(specials.length).toBeGreaterThan(0)
		expect(specials.filter(isVegan).length).toBeGreaterThan(0)
	})
})

/**
 * The wiring, rather than the data: under `--uitesting` the query has to answer
 * from the fixture without reaching the network at all. `@frogpond/api` is left
 * alone here on purpose -- `client` is never initialised in a Jest run, so a
 * query that tried to fetch would throw rather than quietly pass.
 */
/// `queryOptions` types `queryFn` as optional, so narrow it once rather than
/// asserting at each call.
function menuFetcherFor(cafe: string) {
	let {queryFn} = bonAppMenuOptions(cafe)
	if (typeof queryFn !== 'function') {
		throw new Error(`bonAppMenuOptions('${cafe}') built no queryFn`)
	}
	return () => queryFn({} as never)
}

describe('the Menus queries under UI testing', () => {
	test('Stav Hall is answered from the fixture', async () => {
		let menu = await menuFetcherFor('stav-hall')()

		expect(Object.keys(menu.items)).toHaveLength(Object.keys(fixture.items).length)
		expect(menu.days[0].date).toBe('2026-09-05')
	})

	test('a cafe with no fixture is left to the network', async () => {
		await expect(menuFetcherFor('thecage')()).rejects.toThrow()
	})
})
