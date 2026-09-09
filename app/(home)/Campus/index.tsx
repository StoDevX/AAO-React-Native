import * as React from 'react'
import {
	Campus,
	parseCampus,
	useGroupedBuildings,
} from '../../../source/features/building-hours/query'
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
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useMomentTimer} from '@frogpond/timer'

type Props = {
	campus: Campus
}

function CampusView({campus}: Props): React.ReactNode {
	let router = useRouter()
	let dispatch = useAppDispatch()
	let allFavorites = useAppSelector(selectFavoriteBuildings)
	// The list below only ever shows one campus at a time, so it only needs
	// this campus's favourites -- scoping here keeps `BuildingList` itself
	// campus-agnostic, working from plain names the way it always has.
	let favorites = React.useMemo(
		() => allFavorites.filter((f) => f.campus === campus).map((f) => f.name),
		[allFavorites, campus],
	)

	let {now} = useMomentTimer({intervalMs: 60000, startOf: 'minute', timezone: timezone()})

	let {data = [], error, refetch, isLoading, isError} = useGroupedBuildings(campus)

	let [query, setQuery] = React.useState('')
	let searchQuery = useDebounce(query, 200)

	let sections = React.useMemo(() => filterBuildings(data, searchQuery), [data, searchQuery])

	let onToggleFavorite = React.useCallback(
		(building: BuildingType) => dispatch(toggleFavoriteBuilding({campus, name: building.name})),
		[campus, dispatch],
	)

	let onSelect = React.useCallback(
		(building: BuildingType) =>
			router.push({
				pathname: '/Campus/detail/[name]',
				params: {name: building.name, campus},
			}),
		[campus, router],
	)

	// The search chrome is bound to component state (the change handler
	// updates query), so it can't move to a static outer component. Compute
	// it once and render it in every branch, so the user always has a search
	// bar to type into or clear. Carleton's map has no inline mode here -- its
	// button only navigates to the existing hand-hosted `/Map` screen -- so it
	// renders only for the campus that has one.
	let chrome = (
		<>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			{campus === 'carleton' && (
				<Stack.Toolbar placement="right">
					<Stack.Toolbar.Button
						accessibilityLabel="Map"
						icon="map"
						onPress={() => router.push('/Map')}
					/>
				</Stack.Toolbar>
			)}

			<SearchBar onChangeText={setQuery} value={query} />
		</>
	)

	if (isError) {
		return (
			<>
				{chrome}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${error}`}
				/>
			</>
		)
	}

	if (isLoading) {
		return (
			<>
				{chrome}
				<LoadingView />
			</>
		)
	}

	return (
		<>
			{chrome}
			<BuildingList
				favorites={favorites}
				isLoading={isLoading}
				now={now}
				onRefresh={refetch}
				onSelect={onSelect}
				onToggleFavorite={onToggleFavorite}
				searchQuery={searchQuery}
				sections={sections}
			/>
		</>
	)
}

export default function CampusPage(): React.ReactNode {
	let {campus: campusParam} = useLocalSearchParams<{campus?: string}>()
	let campus = parseCampus(campusParam)

	return (
		<>
			<Stack.Title>{campus === 'carleton' ? 'Carleton Campus' : 'Campus'}</Stack.Title>
			<CampusView campus={campus} />
		</>
	)
}
