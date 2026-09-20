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
import {formatWeekday} from '@frogpond/time-format'
import {now as currentMoment} from '@frogpond/timer'
import type {MealHeaderState} from '@frogpond/food-menu'
import {usePublishMenuHeader} from './menu-header'

type Props = {
	name: string
	loadingMessage: string[]
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
const EMPTY_MEAL_HEADER: MealHeaderState = {menu: null, time: null}

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

	let date = formatWeekday(menuDate, 'short')

	// Collapsed to begin with: a menu opens as food rather than as chrome, and
	// the navigation bar carries the control that reveals the row.
	let [filtersVisible, setFiltersVisible] = React.useState(false)
	let toggleFilters = React.useCallback(() => {
		setFiltersVisible((visible) => !visible)
	}, [])

	usePublishMenuHeader(
		{
			name: props.name,
			date,
			meals: mealHeader.menu,
			time: mealHeader.time,
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
