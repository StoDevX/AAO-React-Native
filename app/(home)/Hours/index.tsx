import * as React from 'react'
import {parseCampus, useGroupedBuildings} from '../../../source/features/building-hours/query'
import {BuildingType, Campus} from '../../../source/features/building-hours/types'
import {BuildingList} from '../../../source/features/building-hours/list'
import {filterBuildings} from '../../../source/features/building-hours/lib'
import {SearchBar} from '../../../source/components/search-bar'
import {useAppDispatch, useAppSelector} from '../../../source/redux/hooks'
import {
	favoriteNamesForCampus,
	selectFavoriteBuildings,
	toggleFavoriteBuilding,
} from '../../../source/redux/parts/buildings'

import {timezone} from '@frogpond/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useDebounce} from '@frogpond/use-debounce'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useMomentTimer, useNowOverride} from '@frogpond/timer'
import {useIsDevMode} from '../../../source/lib/use-is-dev-mode'
import {HoursDevSheet} from '../../../source/features/building-hours/dev/hours-dev-sheet'
import {useForceBundledData} from '../../../source/features/building-hours/dev/data-source-store'

type Props = {
	campus: Campus
}

function HoursView({campus}: Props): React.ReactNode {
	let router = useRouter()
	let dispatch = useAppDispatch()
	let allFavorites = useAppSelector(selectFavoriteBuildings)
	// The list below only ever shows one campus at a time, so it only needs
	// this campus's favourites -- scoping here keeps `BuildingList` itself
	// campus-agnostic, working from plain names the way it always has.
	let favorites = React.useMemo(
		() => favoriteNamesForCampus(allFavorites, campus),
		[allFavorites, campus],
	)

	let {now} = useMomentTimer({intervalMs: 60000, startOf: 'minute', timezone: timezone()})

	let isDevMode = useIsDevMode()
	let [devSheetPresented, setDevSheetPresented] = React.useState(false)
	let frozen = useNowOverride((state) => state.frozen)
	let forcedData = useForceBundledData((state) => state.forced)
	let overriding = Boolean(frozen) || forcedData

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
			router.navigate({
				pathname: '/Hours/detail/[name]',
				params: {name: building.name, campus},
			}),
		[campus, router],
	)

	// The search chrome is bound to component state (the change handler
	// updates query), so it can't move to a static outer component. Compute
	// it once and render it in every branch, so the user always has a search
	// bar to type into or clear. St. Olaf's map has a home tile of its own;
	// Carleton's has none, so its Hours screen carries the button to it.
	let chrome = (
		<>
			<Stack.Toolbar placement="bottom">
				<Stack.Toolbar.SearchBarSlot />
			</Stack.Toolbar>

			<Stack.Toolbar placement="right">
				{isDevMode ? (
					<Stack.Toolbar.Button
						accessibilityLabel="Dev overrides"
						icon={overriding ? 'clock.badge.exclamationmark' : 'clock'}
						onPress={() => setDevSheetPresented(true)}
					/>
				) : null}
				{campus === 'carleton' ? (
					<Stack.Toolbar.Button
						accessibilityLabel="Map"
						icon="map"
						onPress={() => router.navigate({pathname: '/Map', params: {campus}})}
					/>
				) : null}
			</Stack.Toolbar>

			<SearchBar onChangeText={setQuery} value={query} />

			<HoursDevSheet isPresented={devSheetPresented} onIsPresentedChange={setDevSheetPresented} />
		</>
	)

	if (isError) {
		return (
			<>
				{chrome}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occurred while loading: ${error}`}
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

export default function HoursPage(): React.ReactNode {
	let {campus: campusParam} = useLocalSearchParams<{campus?: string}>()
	let campus = parseCampus(campusParam)

	return (
		<>
			<Stack.Title>{campus === 'carleton' ? 'Carleton Campus' : 'Hours'}</Stack.Title>
			<HoursView campus={campus} />
		</>
	)
}
