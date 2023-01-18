import {client} from '@frogpond/api'
import {useQuery, UseQueryResult} from '@tanstack/react-query'
import {groupBy} from 'lodash'
import {upgradeMenuItem, upgradeStation} from './lib/process-menu-shorthands'
import type {
	EditedBonAppCafeInfoType,
	EditedBonAppMenuInfoType,
	GithubMenuResponse,
	GithubMenuType,
	MasterCorIconMapType,
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
		return `/food/named/menu/${cafeParam}`
	} else if ('id' in cafeParam) {
		return `/food/menu/${cafeParam.id}`
	} else {
		throw new Error(`Unexpected cafe parameter: ${cafeParam}`)
	}
}

function buildCafePath(cafeParam: string | {id: string}) {
	if (typeof cafeParam === 'string') {
		return `/food/named/cafe/${cafeParam}`
	} else if ('id' in cafeParam) {
		return `/food/cafe/${cafeParam.id}`
	} else {
		throw new Error(`Unexpected cafe parameter: ${cafeParam}`)
	}
}

export function useBonAppCafe(
	cafeParam: string | {id: string},
): UseQueryResult<EditedBonAppCafeInfoType, unknown> {
	return useQuery({
		queryKey: cafeKeys.bonAppCcc(buildCafePath(cafeParam)),
		queryFn: async ({queryKey: [_group, _bonapp, cafePath], signal}) => {
			let response = await client.get(cafePath, {signal}).json()
			return response as EditedBonAppCafeInfoType
		},
		staleTime: 1000 * 60 * 60, // 1 hour
	})
}

export function useBonAppMenu(
	cafeParam: string | {id: string},
): UseQueryResult<EditedBonAppMenuInfoType, unknown> {
	return useQuery({
		queryKey: menuKeys.bonAppCcc(buildMenuPath(cafeParam)),
		queryFn: async ({queryKey: [_group, _bonapp, cafePath], signal}) => {
			let response = await client.get(cafePath, {signal}).json()
			return response as EditedBonAppMenuInfoType
		},
		staleTime: 1000 * 60 * 60, // 1 hour
	})
}

//
// The Pause
//

export function usePauseMenu(): UseQueryResult<GithubMenuType, unknown> {
	return useQuery({
		queryKey: menuKeys.hosted('/food/named/menu/the-pause'),
		queryFn: async ({queryKey: [_menu, _hosted, url], signal}) => {
			let response = await client.get(url, {signal}).json()
			return response as GithubMenuResponse
		},
		select(data) {
			let foodItems: MenuItemType[] = data?.foodItems || []
			let stationMenus: StationMenuType[] = data?.stationMenus || []
			let corIcons: MasterCorIconMapType = data?.corIcons || {}

			let upgradedFoodItems = foodItems.map(upgradeMenuItem)
			let upgradedFoodItemsMap = Object.fromEntries(
				upgradedFoodItems.map((item) => [item.id, item]),
			)
			let foodItemsByStation = groupBy(
				upgradedFoodItems,
				(item) => item.station,
			)

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
			} as GithubMenuType
		},
	})
}
