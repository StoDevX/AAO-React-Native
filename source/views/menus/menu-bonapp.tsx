import * as React from 'react'

import {timezone} from '@frogpond/constants'
import {FoodMenu} from '@frogpond/food-menu'
import {decode, innerTextWithSpaces, parseHtml} from '@frogpond/html-lib'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {toLaxTitleCase} from '@frogpond/titlecase'

import {SUPPORT_EMAIL} from '../../lib/constants'
import {trimItemLabel, trimStationName} from './lib/trim-names'
import {useBonAppCafe, useBonAppMenu} from './query'
import type {
	DayPartMenuType,
	EditedBonAppCafeInfoType as CafeInfoType,
	EditedBonAppMenuInfoType as MenuInfoType,
	MenuItemContainerType,
	MenuItemType,
	ProcessedMealType,
	StationMenuType,
} from './types'
import {mapValues, reduce} from 'lodash'
import sample from 'lodash/sample'
import moment, {type Moment} from 'moment-timezone'

const BONAPP_HTML_ERROR_CODE = 'bonapp-html'

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

type Props = {
	cafe: string | {id: string}
	ignoreProvidedMenus?: boolean
	loadingMessage: string[]
	name: string
}

function findCafeMessage(cafeInfo: CafeInfoType, now: Moment): string | null {
	let actualCafeInfo = cafeInfo.cafe

	let todayDate = now.format('YYYY-MM-DD')
	let todayMenu = actualCafeInfo.days.find(({date}) => date === todayDate)

	if (!todayMenu) {
		return 'Closed today'
	} else if (todayMenu.status === 'closed') {
		return todayMenu.message || 'Closed today'
	}

	return null
}

function buildCustomStationMenu(
	foodItems: MenuItemContainerType,
): Array<StationMenuType> {
	let groupByStation = (
		grouped: Record<string, MenuItemType['id'][]>,
		item: MenuItemType,
	) => {
		if (item.station in grouped) {
			grouped[item.station].push(item.id)
		} else {
			grouped[item.station] = [item.id]
		}
		return grouped
	}

	// go over the list of all food items, turning it into a mapping
	// of {StationName: Array<FoodItemId>}
	let idsGroupedByStation = reduce(foodItems, groupByStation, {})

	// then we make our own StationMenus list
	let paired: Array<[string, Array<string>]> =
		Object.entries(idsGroupedByStation)
	return paired.map(
		([name, items], i): StationMenuType => ({
			// eslint-disable-next-line camelcase
			order_id: String(i),
			id: String(i),
			label: name,
			price: '',
			note: '',
			soup: false,
			items: items,
		}),
	)
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
	stationMenus = stationMenus.map((s) => ({
		...s,
		label: toLaxTitleCase(s.label),
	}))

	return {
		stations: stationMenus,
		label: mealInfo.label || '',
		starttime: mealInfo.starttime || '0:00',
		endtime: mealInfo.endtime || '23:59',
	}
}

function getMeals(
	cafeMenu: MenuInfoType,
	foodItems: MenuItemContainerType,
	args: {ignoreProvidedMenus: boolean},
): Array<ProcessedMealType> {
	let {ignoreProvidedMenus} = args

	// We hard-code to the first day returned because we're only requesting
	// one day. `cafes` is a map of cafe ids to cafes, but we only request one
	// cafe at a time, so we just grab the one we requested.
	let dayparts = cafeMenu.days[0].cafe.dayparts

	// either use the meals as provided by bonapp, or make our own
	let mealInfoItems = dayparts[0]?.length ? dayparts[0] : DEFAULT_MENU

	let ignoreMenus = dayparts[0]?.length ? ignoreProvidedMenus : true

	return mealInfoItems.map((mealInfo) =>
		prepareSingleMenu(mealInfo, foodItems, ignoreMenus),
	)
}

function prepareFood(cafeMenu: MenuInfoType) {
	return mapValues(cafeMenu.items, (item) => ({
		...item, // we want to edit the item, not replace it
		station: decode(toLaxTitleCase(trimStationName(item.station))), // <b>@station names</b> are a mess
		label: decode(trimItemLabel(item.label)), // clean up the titles
		description: innerTextWithSpaces(parseHtml(item.description || '')), // clean up the descriptions
	}))
}

function getErrorMessage(error: Error | undefined) {
	if (!(error instanceof Error)) {
		return 'Unknown Error: Not an Error'
	}

	if (error.message === "JSON Parse error: Unrecognized token '<'") {
		return BONAPP_HTML_ERROR_CODE
	} else {
		return error.message
	}
}

export function BonAppHostedMenu(props: Props): JSX.Element {
	let now = moment.tz(timezone())

	let {
		data: cafeMenu,
		error: menuError,
		refetch: menuReload,
		isError: isMenuError,
		isRefetching: isMenuRefetching,
		isLoading: isMenuLoading,
	} = useBonAppMenu(props.cafe)

	let {
		data: cafeInfo,
		error: cafeError,
		refetch: cafeReload,
		isError: isCafeError,
		isRefetching: isCafeRefetching,
		isLoading: isCafeLoading,
	} = useBonAppCafe(props.cafe)

	let refetching = isMenuRefetching || isCafeRefetching

	if (isMenuLoading || isCafeLoading) {
		return <LoadingView text={sample(props.loadingMessage)} />
	}

	if (isMenuError && menuError instanceof Error) {
		let errorMessage = getErrorMessage(menuError)
		let msg = `Error: ${errorMessage}`
		if (errorMessage === BONAPP_HTML_ERROR_CODE) {
			msg =
				'Something between you and BonApp is having problems. Try again in a minute or two?'
		}
		return <NoticeView buttonText="Again!" onPress={menuReload} text={msg} />
	}

	if (isCafeError && cafeError instanceof Error) {
		let errorMessage = getErrorMessage(cafeError)
		let msg = `Error: ${errorMessage}`
		if (errorMessage === BONAPP_HTML_ERROR_CODE) {
			msg =
				'Something between you and BonApp is having problems. Try again in a minute or two?'
		}
		return <NoticeView buttonText="Again!" onPress={cafeReload} text={msg} />
	}

	if (!cafeMenu || !cafeInfo) {
		let msg = `Something went wrong. Email ${SUPPORT_EMAIL} to let them know?`
		return <NoticeView text={msg} />
	}

	let {ignoreProvidedMenus = false} = props

	// The API returns an empty array for the cafeInfo.cafe value if there is no
	// matching cafe with the inputted id number, otherwise it returns an non-array object
	if (Array.isArray(cafeInfo.cafe)) {
		return <NoticeView text={`There is no cafe with id #${props.cafe}`} />
	}

	// We grab the "today" info from here because BonApp returns special
	// messages in this response, like "Closed for Christmas Break"
	let specialMessage = findCafeMessage(cafeInfo, now)

	// prepare all food items from bonapp for rendering
	let foodItems = prepareFood(cafeMenu)

	let meals = getMeals(cafeMenu, foodItems, {ignoreProvidedMenus})

	return (
		<FoodMenu
			cafeMessage={specialMessage}
			foodItems={foodItems}
			meals={meals}
			menuCorIcons={cafeMenu.cor_icons}
			name={props.name}
			now={now}
			onRefresh={() => {
				cafeReload()
				menuReload()
			}}
			refreshing={refetching}
		/>
	)
}
