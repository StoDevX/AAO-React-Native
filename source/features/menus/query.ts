import {client} from '@frogpond/api'
import {isUITesting} from '@frogpond/launch-arguments'
import {queryOptions} from '@tanstack/react-query'
import {groupBy, mapValues} from 'lodash'
import {decode, innerTextWithSpaces, parseHtml} from '@frogpond/html-lib'
import {toLaxTitleCase} from '@frogpond/titlecase'
import bundledPauseMenu from '../../../docs/pause-menu.json'
import stavCafeFixture from './fixtures/uitest-stav-cafe.json'
import stavMenuFixture from './fixtures/uitest-stav-menu.json'
import {trimItemLabel, trimStationName} from './lib/trim-names'
import {upgradeMenuItem, upgradeStation} from './lib/process-menu-shorthands'
import type {
	EditedBonAppCafeInfoType,
	EditedBonAppMenuInfoType,
	GithubMenuResponse,
	GithubMenuType,
	MasterCorIconMapType,
	MenuItemContainerType,
	MenuItemType,
	StationMenuType,
} from './types'

export const menuKeys = {
	bonAppCcc: (cafePath: string) => ['cafe-menu', 'bonApp', cafePath] as const,
	hosted: (url: string) => ['cafe-menu', 'hosted', url] as const,
}

export const cafeKeys = {
	bonAppCcc: (cafePath: string) => ['cafe-info', 'bonApp', cafePath] as const,
	hosted: (url: string) => ['cafe-info', 'hosted', url] as const,
}

//
// BonApp
//

function buildMenuPath(cafeParam: string | {id: string}) {
	if (typeof cafeParam === 'string') {
		return `food/named/menu/${cafeParam}`
	} else if ('id' in cafeParam) {
		return `food/menu/${cafeParam.id}`
	} else {
		throw new Error(`Unexpected cafe parameter: ${cafeParam}`)
	}
}

function buildCafePath(cafeParam: string | {id: string}) {
	if (typeof cafeParam === 'string') {
		return `food/named/cafe/${cafeParam}`
	} else if ('id' in cafeParam) {
		return `food/cafe/${cafeParam.id}`
	} else {
		throw new Error(`Unexpected cafe parameter: ${cafeParam}`)
	}
}

// Cleans up BonApp's raw station/label/description text -- shared by the
// list screen (BonAppHostedMenu) and the single-item lookup below, so a
// tapped item's detail page renders identically to how it appeared in the
// list it was tapped from.
export function prepareFood(cafeMenu: EditedBonAppMenuInfoType): MenuItemContainerType {
	return mapValues(cafeMenu.items, (item) => ({
		...item,
		station: decode(toLaxTitleCase(trimStationName(item.station))),
		label: decode(trimItemLabel(item.label)),
		description: innerTextWithSpaces(parseHtml(item.description || '')),
	}))
}

/**
 * The cafes a UI test run serves from a fixture, keyed by the path that would
 * otherwise be fetched.
 *
 * Only Stav Hall is captured, because it is the cafe the tests land on. A cafe
 * absent from here still goes to the wire, which is what The Cage and the
 * Carleton halls do.
 */
const UITEST_BONAPP_MENUS: Record<string, unknown> = {
	'food/named/menu/stav-hall': stavMenuFixture,
}

const UITEST_BONAPP_CAFES: Record<string, unknown> = {
	'food/named/cafe/stav-hall': stavCafeFixture,
}

async function fetchBonAppMenu(
	cafeParam: string | {id: string},
	signal?: AbortSignal,
): Promise<EditedBonAppMenuInfoType> {
	let path = buildMenuPath(cafeParam)

	let fixture = isUITesting ? UITEST_BONAPP_MENUS[path] : undefined
	if (fixture) {
		return fixture as EditedBonAppMenuInfoType
	}

	let response = await client.get(path, {signal}).json()
	return response as EditedBonAppMenuInfoType
}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const bonAppCafeOptions = (cafeParam: string | {id: string}) =>
	queryOptions({
		queryKey: cafeKeys.bonAppCcc(buildCafePath(cafeParam)),
		queryFn: async ({signal}) => {
			let path = buildCafePath(cafeParam)

			let fixture = isUITesting ? UITEST_BONAPP_CAFES[path] : undefined
			if (fixture) {
				return fixture as EditedBonAppCafeInfoType
			}

			let response = await client.get(path, {signal}).json()
			return response as EditedBonAppCafeInfoType
		},
		staleTime: 1000 * 60 * 60, // 1 hour
	})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const bonAppMenuOptions = (cafeParam: string | {id: string}) =>
	queryOptions({
		queryKey: menuKeys.bonAppCcc(buildMenuPath(cafeParam)),
		queryFn: ({signal}) => fetchBonAppMenu(cafeParam, signal),
		staleTime: 1000 * 60 * 60, // 1 hour
	})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const bonAppMenuItemOptions = (cafeParam: string | {id: string}, itemId: string) =>
	queryOptions({
		queryKey: menuKeys.bonAppCcc(buildMenuPath(cafeParam)),
		queryFn: ({signal}) => fetchBonAppMenu(cafeParam, signal),
		staleTime: 1000 * 60 * 60, // 1 hour
		select: (data) => ({
			item: prepareFood(data)[itemId],
			icons: data.cor_icons,
		}),
	})

//
// The Pause
//

async function fetchPauseMenu({signal}: {signal: AbortSignal}): Promise<GithubMenuResponse> {
	// The same menu the server would answer with: `bundle-data` builds
	// `docs/pause-menu.json` from `data/pause-menu.yaml`, and deploying that
	// directory is what publishes it.
	if (isUITesting) {
		return (bundledPauseMenu as {data: GithubMenuResponse}).data
	}

	let response = await client.get('food/named/menu/the-pause', {signal}).json()
	return (response as {data: GithubMenuResponse}).data
}

function transformPauseMenu(data: GithubMenuResponse): GithubMenuType {
	let foodItems: MenuItemType[] = data?.foodItems || []
	let stationMenus: StationMenuType[] = data?.stationMenus || []
	let corIcons: MasterCorIconMapType = data?.corIcons || {}

	let upgradedFoodItems = foodItems.map(upgradeMenuItem)
	let upgradedFoodItemsMap = Object.fromEntries(upgradedFoodItems.map((item) => [item.id, item]))
	let foodItemsByStation = groupBy(upgradedFoodItems, (item) => item.station)

	stationMenus = stationMenus.map((menu, index) => ({
		...upgradeStation(menu, index),
		items: foodItemsByStation[menu.label]?.map((item) => item.id) ?? [],
	}))

	let meals = [
		{
			label: 'Menu',
			stations: stationMenus,
			starttime: '0:00',
			endtime: '23:59',
		},
	]

	return {
		foodItems: upgradedFoodItemsMap,
		corIcons: corIcons,
		meals,
	}
}

export const pauseMenuOptions = queryOptions({
	queryKey: menuKeys.hosted('food/named/menu/the-pause'),
	queryFn: fetchPauseMenu,
	select: transformPauseMenu,
})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const pauseMenuItemOptions = (itemId: string) =>
	queryOptions({
		queryKey: menuKeys.hosted('food/named/menu/the-pause'),
		queryFn: fetchPauseMenu,
		select: (data) => {
			let {foodItems, corIcons} = transformPauseMenu(data)
			return {item: foodItems[itemId], icons: corIcons}
		},
	})
