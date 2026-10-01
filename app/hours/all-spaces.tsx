import * as React from 'react'
import {parseCampus, useGroupedBuildings} from '../../source/features/building-hours/query'
import {BuildingType} from '../../source/features/building-hours/types'
import {BuildingList} from '../../source/features/building-hours/list'
import {withoutFavorites} from '../../source/features/building-hours/lib/listed-sections'
import {useAppDispatch, useAppSelector} from '../../source/redux/hooks'
import {
	favoriteNamesForCampus,
	selectFavoriteBuildings,
	toggleFavoriteBuilding,
} from '../../source/redux/parts/buildings'

import {timezone} from '@frogpond/constants'
import {LoadErrorView, LoadingView} from '@frogpond/notice'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useMomentTimer} from '@frogpond/timer'

/// Every venue on the campus by category, including those the Hours list
/// leaves out of its sections.
export default function AllSpacesPage(): React.ReactNode {
	let {campus: campusParam} = useLocalSearchParams<{campus?: string}>()
	let campus = parseCampus(campusParam)
	let router = useRouter()
	let dispatch = useAppDispatch()
	let allFavorites = useAppSelector(selectFavoriteBuildings)
	let favorites = React.useMemo(
		() => favoriteNamesForCampus(allFavorites, campus),
		[allFavorites, campus],
	)

	let {now} = useMomentTimer({intervalMs: 60000, startOf: 'minute', timezone: timezone()})

	let {data = [], error, refetch, isLoading, isError} = useGroupedBuildings(campus)
	let sections = React.useMemo(() => withoutFavorites(data), [data])

	let onToggleFavorite = React.useCallback(
		(building: BuildingType) => dispatch(toggleFavoriteBuilding({campus, name: building.name})),
		[campus, dispatch],
	)

	let onSelect = React.useCallback(
		(building: BuildingType) =>
			router.navigate({
				pathname: '/hours/detail/[name]',
				params: {name: building.name, campus},
			}),
		[campus, router],
	)

	let title = <Stack.Title>All spaces</Stack.Title>

	if (isError) {
		return (
			<>
				{title}
				<LoadErrorView error={error} onRetry={refetch} />
			</>
		)
	}

	if (isLoading) {
		return (
			<>
				{title}
				<LoadingView />
			</>
		)
	}

	return (
		<>
			{title}
			<BuildingList
				favorites={favorites}
				isLoading={isLoading}
				now={now}
				onRefresh={refetch}
				onSelect={onSelect}
				onToggleFavorite={onToggleFavorite}
				searchQuery=""
				sections={sections}
			/>
		</>
	)
}
