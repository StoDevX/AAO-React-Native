// @flow

import type {
	BonAppMenuInfoType as MenuInfoType,
	BonAppCafeInfoType as CafeInfoType,
	StationMenuType,
	ProcessedMealType,
	DayPartMenuType,
	MenuItemContainerType,
	MenuItemType,
} from './types'

import type moment from 'moment'
import reduce from 'lodash/reduce'
import toPairs from 'lodash/toPairs'
import {toLaxTitleCase} from 'titlecase'

const DEFAULT_MENU = [
	{
		label: 'Menu',
		starttime: '0:00',
		endtime: '23:59',
		id: 'na',
		abbreviation: 'M',
		stations: [],
	},
]

export function findCafeMessage(
	cafeId: string,
	cafeInfo: CafeInfoType,
	now: moment,
) {
	const actualCafeInfo = cafeInfo.cafes[cafeId]
	if (!actualCafeInfo) {
		return 'BonApp did not return a menu for that café'
	}

	const todayDate = now.format('YYYY-MM-DD')
	const todayMenu = actualCafeInfo.days.find(({date}) => date === todayDate)

	if (!todayMenu) {
		return 'Closed today'
	} else if (todayMenu.status === 'closed') {
		return todayMenu.message || 'Closed today'
	}

	return null
}

function buildCustomStationMenu(foodItems: MenuItemContainerType) {
	const groupByStation = (grouped, item: MenuItemType) => {
		if (item.station in grouped) {
			grouped[item.station].push(item.id)
		} else {
			grouped[item.station] = [item.id]
		}
		return grouped
	}

	// go over the list of all food items, turning it into a mapping
	// of {StationName: Array<FoodItemId>}
	const idsGroupedByStation = reduce(foodItems, groupByStation, {})

	// then we make our own StationMenus list
	return toPairs(idsGroupedByStation).map(([name, items], i) => ({
		// eslint-disable-next-line camelcase
		order_id: String(i),
		id: String(i),
		label: name,
		price: '',
		note: '',
		soup: false,
		items: items,
	}))
}

function prepareSingleMenu(
	mealInfo: DayPartMenuType,
	foodItems: MenuItemContainerType,
	ignoreProvidedMenus: boolean,
): ProcessedMealType {
	let stationMenus: StationMenuType[] = mealInfo ? mealInfo.stations : []

	if (ignoreProvidedMenus) {
		stationMenus = buildCustomStationMenu(foodItems)
	}

	// Make sure to titlecase the station menus list, too, so the sort works
	const titleCaseLabels = s => ({...s, label: toLaxTitleCase(s.label)})
	stationMenus = stationMenus.map(titleCaseLabels)

	return {
		stations: stationMenus,
		label: mealInfo.label || '',
		starttime: mealInfo.starttime || '0:00',
		endtime: mealInfo.endtime || '23:59',
	}
}

export function getMeals(args: {
	cafeMenu: MenuInfoType,
	cafeId: string,
	ignoreProvidedMenus: boolean,
	foodItems: MenuItemContainerType,
}) {
	const {cafeMenu, cafeId, ignoreProvidedMenus, foodItems} = args

	// We hard-code to the first day returned because we're only requesting
	// one day. `cafes` is a map of cafe ids to cafes, but we only request one
	// cafe at a time, so we just grab the one we requested.
	const dayparts = cafeMenu.days[0].cafes[cafeId].dayparts

	// either use the meals as provided by bonapp, or make our own
	const mealInfoItems = dayparts[0].length ? dayparts[0] : DEFAULT_MENU

	const ignoreMenus = dayparts[0].length ? ignoreProvidedMenus : true
	return mealInfoItems.map(mealInfo =>
		prepareSingleMenu(mealInfo, foodItems, ignoreMenus),
	)
}
