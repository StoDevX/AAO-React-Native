import * as React from 'react'
import {timezone} from '@frogpond/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {FoodMenu} from '@frogpond/food-menu'
import moment from 'moment-timezone'
import sample from 'lodash/sample'
import {pauseMenuOptions} from './query'
import {useQuery} from '@tanstack/react-query'
import {useIsFocused, useRouter} from 'expo-router'
import type {GithubMenuType} from './types'
import {now as currentMoment, useMomentTimer} from '@frogpond/timer'
import {formatWeekday} from '@frogpond/time-format'
import type {MealHeaderState} from '@frogpond/food-menu'
import {buildingByNameOptions} from '../building-hours/query'
import {cafeHours} from './lib/cafe-hours'
import {usePublishMenuHeader} from './menu-header'

type Props = {
	name: string
	loadingMessage: string[]
	/**
	 * The venue in `spaces/hours` whose schedule these are, e.g. `The Pause
	 * Kitchen`, or nothing for a menu whose hours we do not publish.
	 *
	 * Named by the route rather than derived from `name`: the venue is a key
	 * into a file the college maintains by hand, and a screen may title itself
	 * without publishing hours. A name it no longer matches costs the header its
	 * hours, which is the same blank line this screen drew before it had any.
	 */
	venue?: string
}

// Module-level so its identity is stable across renders. `useQuery` reports
// `data: undefined` while offline (`networkMode: 'online'` leaves `isLoading`
// false once the fetch is merely paused) and transiently during cold-launch
// cache restoration, so this default is live far more often than "no data
// yet" suggests -- a fresh object literal here would hand `FoodMenu` a new
// `corIcons` reference on every one of those renders.
const EMPTY_MENU: GithubMenuType = {foodItems: {}, meals: [], corIcons: {}}

// Module-level for the same reason: one identity rather than a fresh object
// per mount.
const EMPTY_MEAL_HEADER: MealHeaderState = {menu: null, time: null, closed: false}

export function GitHubHostedMenu(props: Props): React.ReactNode {
	let router = useRouter()
	let isFocused = useIsFocused()
	let [mealHeader, setMealHeader] = React.useState<MealHeaderState>(EMPTY_MEAL_HEADER)

	let {
		data = EMPTY_MENU,
		error,
		isError,
		isLoading,
		refetch,
		dataUpdatedAt,
	} = useQuery(pauseMenuOptions)

	// `dataUpdatedAt` is 0 until the query resolves, which is the epoch rather
	// than a day anyone is reading about.
	let menuDate = dataUpdatedAt
		? moment.tz(dataUpdatedAt, timezone())
		: currentMoment().tz(timezone())

	// Collapsed to begin with: a menu opens as food rather than as chrome, and
	// the navigation bar carries the control that reveals the row.
	let [filtersVisible, setFiltersVisible] = React.useState(false)
	let toggleFilters = React.useCallback(() => {
		setFiltersVisible((visible) => !visible)
	}, [])

	// The hours come from the venue's building schedule rather than from the
	// menu, which carries none: `transformPauseMenu` stands up one all-day meal
	// in place of dayparts nobody publishes for the Pause, and `formatMealTimes`
	// reports a whole-day window as no window at all.
	//
	// Shares the Campus screen's cache key, so a reader who has been there pays
	// nothing for this.
	let {data: venue, isLoading: isVenueLoading} = useQuery({
		...buildingByNameOptions('stolaf', props.venue ?? ''),
		// A disabled query is pending but never fetching, which React Query
		// reports as `isLoading: false` -- so the header below needs no guard of
		// its own for a screen that named no venue.
		enabled: Boolean(props.venue),
	})

	// Read off the clock rather than off `menuDate`, which is when the menu was
	// fetched, and a clock that ticks: the line under the name is relative to
	// it -- `Opens at 4 PM` is false a minute after four -- and a tab stays
	// mounted for as long as the reader keeps coming back to it. The day and
	// the line both come back as strings, so each tick republishes the header
	// only when one of them has changed.
	let {now: clock} = useMomentTimer({intervalMs: 60_000, timezone: timezone()})
	let weekdayShort = formatWeekday(clock, 'short')
	let weekdayLong = formatWeekday(clock, 'long')
	let hours = cafeHours(venue, clock)

	usePublishMenuHeader(
		{
			// The day is the hours' day rather than the menu's: this menu is a
			// file we keep rather than a day's service, but the hours under its
			// name do turn over, and a reader checking whether the Pause is open
			// is asking about today.
			name: props.name,
			weekdayShort,
			weekdayLong,
			date: null,
			meals: mealHeader.menu,
			time: props.venue && venue ? hours.time : mealHeader.time,
			closed: mealHeader.closed || hours.closed,
			reopening: hours.reopening,
			loading: isLoading || isVenueLoading,
			filters: {visible: filtersVisible, toggle: toggleFilters},
		},
		isFocused,
	)

	if (isLoading) {
		return <LoadingView text={sample(props.loadingMessage)} />
	}

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	return (
		<FoodMenu
			foodItems={data.foodItems}
			meals={data.meals}
			menuCorIcons={data.corIcons}
			name={props.name}
			now={menuDate}
			onItemPress={(item) =>
				router.navigate({
					pathname: '/MenuItemDetail',
					params: {source: 'pause', itemId: item.id},
				})
			}
			filtersVisible={filtersVisible}
			onMealHeaderChange={setMealHeader}
			onRefresh={refetch}
		/>
	)
}
