import {decode} from '@frogpond/html-lib'
import {toLaxTitleCase} from '@frogpond/titlecase'
import type {
	DayPartMenuType,
	EditedBonAppMenuInfoType as MenuInfoType,
	MenuItemContainerType,
	MenuItemType,
	ProcessedMealType,
	StationMenuType,
} from '../types'

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

const groupByStation = (
	grouped: Record<string, MenuItemType['id'][]>,
	item: MenuItemType,
): Record<string, MenuItemType['id'][]> => {
	if (item.station in grouped) {
		grouped[item.station].push(item.id)
	} else {
		grouped[item.station] = [item.id]
	}
	return grouped
}

function buildCustomStationMenu(foodItems: MenuItemContainerType): Array<StationMenuType> {
	// go over the list of all food items, turning it into a mapping
	// of {StationName: Array<FoodItemId>}
	let idsGroupedByStation = Object.values(foodItems).reduce(groupByStation, {})

	// then we make our own StationMenus list
	let paired: Array<[string, Array<string>]> = Object.entries(idsGroupedByStation)
	return paired.map(([name, items], i): StationMenuType => ({
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

	// Make sure to titlecase the station menus list, too, so the sort works,
	// decoding it first as the items' own stations are
	stationMenus = stationMenus.map((s) => ({
		...s,
		label: toLaxTitleCase(decode(s.label)),
	}))

	return {
		stations: stationMenus,
		label: mealInfo.label || '',
		starttime: mealInfo.starttime || '0:00',
		endtime: mealInfo.endtime || '23:59',
	}
}

export function bonAppMeals(
	cafeMenu: MenuInfoType,
	foodItems: MenuItemContainerType,
	args: {ignoreProvidedMenus: boolean},
): Array<ProcessedMealType> {
	let {ignoreProvidedMenus} = args

	// We hard-code to the first day returned because we're only requesting
	// one day. `cafes` is a map of cafe ids to cafes, but we only request one
	// cafe at a time, so we just grab the one we requested. A response with no
	// day has no meals; the screen says so rather than drawing an empty menu.
	let day = cafeMenu.days.at(0)
	if (!day) {
		return []
	}
	let dayparts = day.cafe.dayparts

	// either use the meals as provided by bonapp, or make our own
	let mealInfoItems = dayparts[0]?.length ? dayparts[0] : DEFAULT_MENU

	let ignoreMenus = dayparts[0]?.length ? ignoreProvidedMenus : true

	return mealInfoItems.map((mealInfo) => prepareSingleMenu(mealInfo, foodItems, ignoreMenus))
}
