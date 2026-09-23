import * as React from 'react'
import {timezone} from '@frogpond/constants'
import {SUPPORT_EMAIL} from '../../lib/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {FoodMenu} from '@frogpond/food-menu'
import type {
	DayPartMenuType,
	EditedBonAppMenuInfoType as MenuInfoType,
	MenuItemContainerType,
	MenuItemType,
	ProcessedMealType,
	StationMenuType,
} from './types'
import sample from 'lodash/sample'
import {reduce} from 'lodash'
import {now as currentMoment} from '@frogpond/timer'
import {bonAppCafeOptions, bonAppMenuOptions, prepareFood} from './query'
import {findCafeMessage} from './lib/cafe-message'
import {daypartHours} from './lib/daypart-hours'
import {useQuery} from '@tanstack/react-query'
import {useIsFocused, useRouter} from 'expo-router'
import {toLaxTitleCase} from '@frogpond/titlecase'
import {formatDate, formatWeekday} from '@frogpond/time-format'
import type {MealHeaderState} from '@frogpond/food-menu'
import {usePublishMenuHeader} from './menu-header'

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

// Module-level so the state below starts on one identity rather than a fresh
// object per mount.
const EMPTY_MEAL_HEADER: MealHeaderState = {menu: null, time: null, closed: false}

type Props = {
	cafe: string | {id: string}
	ignoreProvidedMenus?: boolean
	loadingMessage: string[]
	name: string
}

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
	let idsGroupedByStation = reduce(foodItems, groupByStation, {})

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

	return mealInfoItems.map((mealInfo) => prepareSingleMenu(mealInfo, foodItems, ignoreMenus))
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

export function BonAppHostedMenu(props: Props): React.ReactNode {
	// Which meal a cafe opens on is read off the clock, so a UI test run takes
	// the frozen one its fixtures are anchored to. Noon lands in lunch.
	let now = currentMoment().tz(timezone())
	let router = useRouter()

	// Live focus rather than the latched `useHasEverBeenFocused` the tabs use
	// to defer their mounting: every cafe the reader has already visited stays
	// mounted, and only the one in front of them may title the screen.
	let isFocused = useIsFocused()
	let [mealHeader, setMealHeader] = React.useState<MealHeaderState>(EMPTY_MEAL_HEADER)

	// The weekday alone under the cafe's name, where the line is already tight
	// -- the date beside it said which today it is, which the reader knows --
	// and the whole date over the meal picker, which has room for it. Both
	// lengths of the weekday go over, since which one fits depends on whether a
	// meal ends up sharing its line.
	//
	// Formatted days, not `now`: `currentMoment()` above builds a fresh Moment
	// on every render, so a header depending on it would republish on every
	// render and loop through the provider's state.
	let weekdayShort = formatWeekday(now, 'short')
	let weekdayLong = formatWeekday(now, 'long')
	let date = formatDate(now, 'medium')

	// Collapsed to begin with: a menu opens as food rather than as chrome, and
	// the navigation bar carries the control that reveals the row.
	let [filtersVisible, setFiltersVisible] = React.useState(false)
	let toggleFilters = React.useCallback(() => {
		setFiltersVisible((visible) => !visible)
	}, [])

	let {
		data: cafeMenu,
		error: menuError,
		refetch: menuReload,
		isError: isMenuError,
		isLoading: isMenuLoading,
	} = useQuery(bonAppMenuOptions(props.cafe))

	let {
		data: cafeInfo,
		error: cafeError,
		refetch: cafeReload,
		isError: isCafeError,
		isLoading: isCafeLoading,
	} = useQuery(bonAppCafeOptions(props.cafe))

	// A cafe serving one daypart today says when it opens, then when it closes,
	// off the hours it publishes; `null` keeps the meal's window for the rest.
	let hours = daypartHours(cafeInfo?.cafe.days, now)

	// Published from here rather than from the menu below, which does not
	// exist until its query resolves -- the screen would spend that whole
	// first load under the previous cafe's name.
	usePublishMenuHeader(
		{
			name: props.name,
			weekdayShort,
			weekdayLong,
			date,
			meals: mealHeader.menu,
			time: hours ? hours.time : mealHeader.time,
			closed: mealHeader.closed || (hours?.closed ?? false),
			reopening: hours?.reopening ?? null,
			loading: isMenuLoading || isCafeLoading,
			filters: {visible: filtersVisible, toggle: toggleFilters},
		},
		isFocused,
	)

	let {ignoreProvidedMenus = false} = props

	// Derived above the early returns below, because hooks cannot be called
	// after one. `prepareFood` rebuilds every item in the cafe -- 250 of them at
	// Stav -- so recomputing it per render handed `FoodMenu` 250 fresh object
	// identities each time and defeated the memoization it does internally.
	let foodItems = React.useMemo(() => (cafeMenu ? prepareFood(cafeMenu) : {}), [cafeMenu])

	let meals = React.useMemo(
		() => (cafeMenu ? getMeals(cafeMenu, foodItems, {ignoreProvidedMenus}) : []),
		[cafeMenu, foodItems, ignoreProvidedMenus],
	)

	// Stable so that a menu re-rendering for any other reason does not force
	// every one of its rows to re-render with it.
	let onItemPress = React.useCallback(
		(item: MenuItemType) => {
			router.navigate({
				pathname: '/MenuItemDetail',
				params: {
					source: 'bonapp',
					cafe: typeof props.cafe === 'string' ? props.cafe : props.cafe.id,
					itemId: item.id,
				},
			})
		},
		[router, props.cafe],
	)

	let onRefresh = React.useCallback(
		() => Promise.all([cafeReload(), menuReload()]),
		[cafeReload, menuReload],
	)

	if (isMenuLoading || isCafeLoading) {
		return <LoadingView text={sample(props.loadingMessage)} />
	}

	if (isMenuError && menuError instanceof Error) {
		let errorMessage = getErrorMessage(menuError)
		let msg = `Error: ${errorMessage}`
		if (errorMessage === BONAPP_HTML_ERROR_CODE) {
			msg = 'Something between you and BonApp is having problems. Try again in a minute or two?'
		}
		return <NoticeView buttonText="Again!" onPress={menuReload} text={msg} />
	}

	if (isCafeError && cafeError instanceof Error) {
		let errorMessage = getErrorMessage(cafeError)
		let msg = `Error: ${errorMessage}`
		if (errorMessage === BONAPP_HTML_ERROR_CODE) {
			msg = 'Something between you and BonApp is having problems. Try again in a minute or two?'
		}
		return <NoticeView buttonText="Again!" onPress={cafeReload} text={msg} />
	}

	if (!cafeMenu || !cafeInfo) {
		let msg = `Something went wrong. Email ${SUPPORT_EMAIL} to let them know?`
		return <NoticeView text={msg} />
	}

	// The API returns an empty array for the cafeInfo.cafe value if there is no
	// matching cafe with the inputted id number, otherwise it returns an non-array object
	if (Array.isArray(cafeInfo.cafe)) {
		return (
			<NoticeView
				text={`There is no cafe with id #${
					typeof props.cafe === 'string' ? props.cafe : props.cafe.id
				}`}
			/>
		)
	}

	// We grab the "today" info from here because BonApp returns special
	// messages in this response, like "Closed for Christmas Break"
	let specialMessage = findCafeMessage(cafeInfo, now)

	return (
		<FoodMenu
			cafeMessage={specialMessage}
			foodItems={foodItems}
			meals={meals}
			menuCorIcons={cafeMenu.cor_icons}
			name={props.name}
			now={now}
			onItemPress={onItemPress}
			filtersVisible={filtersVisible}
			onMealHeaderChange={setMealHeader}
			onRefresh={onRefresh}
		/>
	)
}
