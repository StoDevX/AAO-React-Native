import * as React from 'react'
import {useGroupedBuildings} from '../../../source/features/building-hours/query'
import {BuildingType} from '../../../source/features/building-hours/types'
import {BuildingList} from '../../../source/features/building-hours/list'
import {filterBuildings} from '../../../source/features/building-hours/lib'
import {SearchBar} from '../../../source/components/search-bar'
import {useAppDispatch, useAppSelector} from '../../../source/redux/hooks'
import {
	selectFavoriteBuildings,
	toggleFavoriteBuilding,
} from '../../../source/redux/parts/buildings'

import {timezone} from '@frogpond/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useDebounce} from '@frogpond/use-debounce'
import {Stack, useRouter} from 'expo-router'
import {useMomentTimer} from '@frogpond/timer'

function BuildingHoursView(): React.ReactNode {
	let router = useRouter()
	let dispatch = useAppDispatch()
	let favorites = useAppSelector(selectFavoriteBuildings)

	let {now} = useMomentTimer({intervalMs: 60000, startOf: 'minute', timezone: timezone()})

	let {data = [], error, refetch, isLoading, isError} = useGroupedBuildings()

	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query, 200)

	let sections = React.useMemo(() => filterBuildings(data, searchQuery), [data, searchQuery])

	let onToggleFavorite = React.useCallback(
		(building: BuildingType) => dispatch(toggleFavoriteBuilding(building.name)),
		[dispatch],
	)

	let onReport = React.useCallback(
		(building: BuildingType) =>
			router.push({
				pathname: '/BuildingHoursProblemReport',
				params: {name: building.name},
			}),
		[router],
	)

	// The search chrome is bound to component state (the change handler
	// updates query), so it can't move to a static outer component.
	// Compute it once and render it in every branch, so the user always
	// has a search bar to type into or clear.
	let searchChrome = (
		<>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			<SearchBar onChangeText={setQuery} value={query} />
		</>
	)

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	if (isLoading) {
		return (
			<>
				{searchChrome}
				<LoadingView />
			</>
		)
	}

	return (
		<>
			{searchChrome}
			<BuildingList
				favorites={favorites}
				isLoading={isLoading}
				now={now}
				onRefresh={refetch}
				onReport={onReport}
				onToggleFavorite={onToggleFavorite}
				searchQuery={searchQuery}
				sections={sections}
			/>
		</>
	)
}

export default function BuildingHoursPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Building Hours</Stack.Title>
			<BuildingHoursView />
		</>
	)
}
