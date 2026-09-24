import * as React from 'react'
import {timezone} from '@frogpond/constants'
import moment from 'moment-timezone'
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
import {useMomentTimer} from '@frogpond/timer'
import {bonAppCafeOptions, bonAppMenuOptions, prepareFood} from './query'
import {findCafeMessage} from './lib/cafe-message'
import {daypartHours} from './lib/daypart-hours'
import {useQuery} from '@tanstack/react-query'
import {useIsFocused, useRouter} from 'expo-router'
import {toLaxTitleCase} from '@frogpond/titlecase'
import {decode} from '@frogpond/html-lib'
import {formatDate, formatWeekday} from '@frogpond/time-format'
import type {MealHeaderState} from '@frogpond/food-menu'
import {usePublishMenuHeader} from './menu-header'
import {OFFLINE_MESSAGE, menuView} from './lib/menu-view'

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

function getMeals(
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
	//
	// A clock that ticks: the line under the name is relative to it -- `Opens
	// at 7:30 AM` is false a minute later -- and a tab stays mounted for as long
	// as the reader keeps coming back to it.
	let {now} = useMomentTimer({intervalMs: 60_000, timezone: timezone()})

	// The menu body's clock turns over with the day rather than the minute.
	// Every cafe the reader has visited stays mounted and ticks, and only the
	// header needs the minute; the body reads its clock for the meal it opens on
	// and the day's message, both of which hold for the day.
	let [menuNow, setMenuNow] = React.useState(now)
	if (!menuNow.isSame(now, 'day')) {
		setMenuNow(now)
	}
	let router = useRouter()

	// Live focus rather than the latched `useHasEverBeenFocused` the tabs use
	// to defer their mounting: every cafe the reader has already visited stays
	// mounted, and only the one in front of them may title the screen.
	let isFocused = useIsFocused()
	let [mealHeader, setMealHeader] = React.useState<MealHeaderState>(EMPTY_MEAL_HEADER)

	// Collapsed to begin with: a menu opens as food rather than as chrome, and
	// the navigation bar carries the control that reveals the row.
	let [filtersVisible, setFiltersVisible] = React.useState(false)
	let toggleFilters = React.useCallback(() => {
		setFiltersVisible((visible) => !visible)
	}, [])

	// The day the menu and the cafe's details are for. It turns over with
	// `menuNow`, and the new day's are fetched in place of the last day's.
	// Memoized on `menuNow` so that the item links built from it keep their
	// identity: the React Compiler reads a moment's `format` as a read of an
	// object that may change under it.
	let day = React.useMemo(() => menuNow.format('YYYY-MM-DD'), [menuNow])

	let menuQuery = useQuery(bonAppMenuOptions(props.cafe, day))
	let {data: cafeMenu, refetch: menuReload} = menuQuery
	let menu = menuView(menuQuery)

	// The cafe's details carry its hours and any closure notice. The menu is
	// shown without them when they cannot be had, so only their first load
	// holds the screen.
	let cafeQuery = useQuery(bonAppCafeOptions(props.cafe, day))
	let {data: cafeInfo, refetch: cafeReload} = cafeQuery
	let isCafeLoading = menuView(cafeQuery).kind === 'loading'

	// The API returns an empty array for the cafeInfo.cafe value if there is no
	// matching cafe with the inputted id number, otherwise it returns an non-array object
	let isUnknownCafe = cafeInfo !== undefined && Array.isArray(cafeInfo.cafe)
	let hasNoDays = menu.kind === 'content' && menu.data.days.length === 0

	let isLoading = menu.kind === 'loading' || (menu.kind === 'content' && isCafeLoading)
	let showsMenu = menu.kind === 'content' && !isCafeLoading && !isUnknownCafe && !hasNoDays

	// The day the menu in hand is for. Asked for today's shortly after
	// midnight, the server can still answer with the day before's, so the
	// header names the menu's own day rather than the clock's.
	let menuDate = cafeMenu?.days.at(0)?.date ?? null
	let isOtherDay = menuDate !== null && menuDate !== day
	let otherDay = React.useMemo(
		() => (isOtherDay && menuDate ? moment.tz(menuDate, 'YYYY-MM-DD', timezone()) : null),
		[isOtherDay, menuDate],
	)
	let shownDay = otherDay ?? now

	// The weekday alone under the cafe's name, where the line is already tight
	// -- the date beside it said which today it is, which the reader knows --
	// and the whole date over the meal picker, which has room for it. Both
	// lengths of the weekday go over, since which one fits depends on whether a
	// meal ends up sharing its line.
	//
	// Formatted days, not `now`: the header is read field by field, so strings
	// republish it only when the day itself changes.
	let weekdayShort = formatWeekday(shownDay, 'short')
	let weekdayLong = formatWeekday(shownDay, 'long')
	let date = formatDate(shownDay, 'medium')

	// A cafe serving one daypart today says when it opens, then when it closes,
	// off the hours it publishes; `null` keeps the meal's window for the rest.
	// Today's hours say nothing about another day's menu.
	let hours = isOtherDay ? null : daypartHours(cafeInfo?.cafe.days, now)

	// The meal picker and its hours belong to the menu body, which is not drawn
	// behind a notice.
	let shownMealHeader = showsMenu ? mealHeader : EMPTY_MEAL_HEADER

	// Published from here rather than from the menu below, which does not
	// exist until its query resolves -- the screen would spend that whole
	// first load under the previous cafe's name.
	usePublishMenuHeader(
		{
			name: props.name,
			weekdayShort,
			weekdayLong,
			date,
			meals: shownMealHeader.menu,
			time: hours ? hours.time : shownMealHeader.time,
			closed: shownMealHeader.closed || (hours?.closed ?? false),
			reopening: hours?.reopening ?? null,
			loading: isLoading,
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
	//
	// A cafe named by id goes over as `cafeId` rather than `cafe`, which the
	// detail screen reads as a cafe's name.
	let onItemPress = React.useCallback(
		(item: MenuItemType) => {
			router.navigate({
				pathname: '/MenuItemDetail',
				params:
					typeof props.cafe === 'string'
						? {source: 'bonapp', cafe: props.cafe, day, itemId: item.id}
						: {source: 'bonapp', cafeId: props.cafe.id, day, itemId: item.id},
			})
		},
		[router, props.cafe, day],
	)

	let onRefresh = React.useCallback(
		() => Promise.all([cafeReload(), menuReload()]),
		[cafeReload, menuReload],
	)

	if (menu.kind === 'loading') {
		return <LoadingView text={sample(props.loadingMessage)} />
	}

	if (menu.kind === 'offline') {
		return <NoticeView text={OFFLINE_MESSAGE} />
	}

	if (menu.kind === 'error') {
		let errorMessage = getErrorMessage(menu.error)
		let msg = `Error: ${errorMessage}`
		if (errorMessage === BONAPP_HTML_ERROR_CODE) {
			msg = 'Something between you and BonApp is having problems. Try again in a minute or two?'
		}
		return <NoticeView buttonText="Again!" onPress={menuReload} text={msg} />
	}

	if (isCafeLoading) {
		return <LoadingView text={sample(props.loadingMessage)} />
	}

	if (isUnknownCafe) {
		return (
			<NoticeView
				text={`There is no cafe with id #${
					typeof props.cafe === 'string' ? props.cafe : props.cafe.id
				}`}
			/>
		)
	}

	if (hasNoDays) {
		return <NoticeView text={`${props.name} has not posted a menu for today.`} />
	}

	// We grab the "today" info from here because BonApp returns special
	// messages in this response, like "Closed for Christmas Break"
	let specialMessage = cafeInfo ? findCafeMessage(cafeInfo, menuNow) : null

	return (
		<FoodMenu
			cafeMessage={specialMessage}
			foodItems={foodItems}
			meals={meals}
			menuCorIcons={menu.data.cor_icons}
			name={props.name}
			now={menuNow}
			onItemPress={onItemPress}
			filtersVisible={filtersVisible}
			onMealHeaderChange={setMealHeader}
			onRefresh={onRefresh}
		/>
	)
}
