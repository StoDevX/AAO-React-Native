import {clientFor} from '@frogpond/api'
import {servesBundledFixtures} from '@frogpond/launch-arguments'
import {queryOptions} from '@tanstack/react-query'
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
import {groupBy} from '@frogpond/collections'
import type {CampusId} from '../../campuses'

/**
 * A BonApp menu and a cafe's details are each for the day they were fetched,
 * as `YYYY-MM-DD` in campus time. The day is in their keys so that a new day
 * fetches its own, rather than showing the last day's while it is still fresh.
 */
export const menuKeys = {
	bonAppCcc: (server: CampusId, cafePath: string, day: string) =>
		['cafe-menu', 'bonApp', server, cafePath, day] as const,
	hosted: (server: CampusId, path: string) => ['cafe-menu', 'hosted', server, path] as const,
}

export const cafeKeys = {
	bonAppCcc: (server: CampusId, cafePath: string, day: string) =>
		['cafe-info', 'bonApp', server, cafePath, day] as const,
	hosted: (server: CampusId, path: string) => ['cafe-info', 'hosted', server, path] as const,
}

//
// BonApp
//

// A cafe named by id is asked for with the id in the query string as well as
// the path. ccc-server reads it only from the query, and answers without it
// with a 400, `?cafeId is required`.

function buildMenuPath(cafeParam: string | {id: string}) {
	if (typeof cafeParam === 'string') {
		return `food/named/menu/${cafeParam}`
	} else if ('id' in cafeParam) {
		return `food/menu/${cafeParam.id}?cafeId=${cafeParam.id}`
	} else {
		throw new Error(`Unexpected cafe parameter: ${cafeParam}`)
	}
}

function buildCafePath(cafeParam: string | {id: string}) {
	if (typeof cafeParam === 'string') {
		return `food/named/cafe/${cafeParam}`
	} else if ('id' in cafeParam) {
		return `food/cafe/${cafeParam.id}?cafeId=${cafeParam.id}`
	} else {
		throw new Error(`Unexpected cafe parameter: ${cafeParam}`)
	}
}

// Cleans up BonApp's raw station/label/description text -- shared by the
// list screen (BonAppHostedMenu) and the single-item lookup below, so a
// tapped item's detail page renders identically to how it appeared in the
// list it was tapped from.
export function prepareFood(cafeMenu: EditedBonAppMenuInfoType): MenuItemContainerType {
	return Object.fromEntries(
		Object.entries(cafeMenu.items).map(([id, item]) => [
			id,
			{
				...item,
				// Decoded before title-casing, which would otherwise turn `&amp;` into
				// `&Amp;`, which is no longer an entity.
				station: toLaxTitleCase(decode(trimStationName(item.station))),
				sub_station: toLaxTitleCase(decode(item.sub_station || '')),
				label: trimItemLabel(decode(item.label)),
				description: innerTextWithSpaces(parseHtml(item.description || '')),
			},
		]),
	)
}

/**
 * The cafes a UI test run naming no campus serves from a fixture, keyed by the path that would
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
	server: CampusId,
	cafeParam: string | {id: string},
	signal?: AbortSignal,
): Promise<EditedBonAppMenuInfoType> {
	let path = buildMenuPath(cafeParam)

	let fixture = servesBundledFixtures ? UITEST_BONAPP_MENUS[path] : undefined
	if (fixture) {
		return fixture as EditedBonAppMenuInfoType
	}

	let response = await clientFor(server).get(path, {signal}).json()
	return response as EditedBonAppMenuInfoType
}

/** A café's details from `server`, the menus server of the campus whose café it is. */
export const bonAppCafeOptions = (
	server: CampusId,
	cafeParam: string | {id: string},
	day: string,
	// oxlint-disable-next-line typescript/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: cafeKeys.bonAppCcc(server, buildCafePath(cafeParam), day),
		queryFn: async ({signal}) => {
			let path = buildCafePath(cafeParam)

			let fixture = servesBundledFixtures ? UITEST_BONAPP_CAFES[path] : undefined
			if (fixture) {
				return fixture as EditedBonAppCafeInfoType
			}

			let response = await clientFor(server).get(path, {signal}).json()
			return response as EditedBonAppCafeInfoType
		},
		staleTime: 1000 * 60 * 60, // 1 hour
	})

/** A café's menu from `server`, the menus server of the campus whose café it is. */
export const bonAppMenuOptions = (
	server: CampusId,
	cafeParam: string | {id: string},
	day: string,
	// oxlint-disable-next-line typescript/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: menuKeys.bonAppCcc(server, buildMenuPath(cafeParam), day),
		queryFn: ({signal}) => fetchBonAppMenu(server, cafeParam, signal),
		staleTime: 1000 * 60 * 60, // 1 hour
	})

export const bonAppMenuItemOptions = (
	server: CampusId,
	cafeParam: string | {id: string},
	day: string,
	itemId: string,
	// oxlint-disable-next-line typescript/explicit-module-boundary-types
) =>
	queryOptions({
		queryKey: menuKeys.bonAppCcc(server, buildMenuPath(cafeParam), day),
		queryFn: ({signal}) => fetchBonAppMenu(server, cafeParam, signal),
		staleTime: 1000 * 60 * 60, // 1 hour
		select: (data) => ({
			item: prepareFood(data)[itemId],
			icons: data.cor_icons,
		}),
	})

//
// The Pause
//

async function fetchPauseMenu(
	server: CampusId,
	{signal}: {signal: AbortSignal},
): Promise<GithubMenuResponse> {
	// The same menu the server would answer with: `bundle-data` builds
	// `docs/pause-menu.json` from `data/pause-menu.yaml`, and deploying that
	// directory is what publishes it.
	if (servesBundledFixtures) {
		return (bundledPauseMenu as {data: GithubMenuResponse}).data
	}

	let response = await clientFor(server).get('food/named/menu/the-pause', {signal}).json()
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

/** The Pause's menu from `server`, St. Olaf's menus server. */
// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const pauseMenuOptions = (server: CampusId) =>
	queryOptions({
		queryKey: menuKeys.hosted(server, 'food/named/menu/the-pause'),
		queryFn: ({signal}) => fetchPauseMenu(server, {signal}),
		select: transformPauseMenu,
	})

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export const pauseMenuItemOptions = (server: CampusId, itemId: string) =>
	queryOptions({
		queryKey: menuKeys.hosted(server, 'food/named/menu/the-pause'),
		queryFn: ({signal}) => fetchPauseMenu(server, {signal}),
		select: (data) => {
			let {foodItems, corIcons} = transformPauseMenu(data)
			return {item: foodItems[itemId], icons: corIcons}
		},
	})
