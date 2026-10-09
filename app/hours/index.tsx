import * as React from 'react'
import {useGroupedBuildings} from '../../source/features/building-hours/query'
import {BuildingType} from '../../source/features/building-hours/types'
import type {HoursSection} from '../../source/features/building-hours/campus-section'
import {campusById, type CampusId} from '../../source/campuses'
import {useCampusParam} from '../../source/features/campus/campus-param'
import {BuildingList} from '../../source/features/building-hours/list'
import {filterBuildings} from '../../source/features/building-hours/lib'
import {hasUnlisted, listedSections} from '../../source/features/building-hours/lib/listed-sections'
import {SearchBar} from '../../source/components/search-bar'
import {useAppDispatch, useAppSelector} from '../../source/redux/hooks'
import {
	favoriteNamesForCampus,
	selectFavoriteBuildings,
	toggleFavoriteBuilding,
} from '../../source/redux/parts/buildings'

import {timezone} from '@frogpond/constants'
import {LoadErrorView, LoadingView, NoticeView} from '@frogpond/notice'
import {useDebounce} from '@frogpond/use-debounce'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useMomentTimer, useNowOverride} from '@frogpond/timer'
import {useIsDevMode} from '../../source/lib/use-is-dev-mode'
import {HoursDevSheet} from '../../source/features/building-hours/dev/hours-dev-sheet'
import {useForceBundledData} from '../../source/features/building-hours/dev/data-source-store'

type Props = {
	campus: CampusId
	hours: HoursSection
}

function HoursView({campus, hours}: Props): React.ReactNode {
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

	let sections = React.useMemo(
		() => filterBuildings(listedSections(data, searchQuery), searchQuery),
		[data, searchQuery],
	)
	// A search already reaches every venue, so the way to the rest is offered
	// only when nothing is typed, and only when something is left out.
	let offerAllSpaces = hasUnlisted(data) && !searchQuery.trim()

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

	let onShowAllSpaces = React.useCallback(
		() => router.navigate({pathname: '/hours/all-spaces', params: {campus}}),
		[campus, router],
	)

	// The search chrome is bound to component state (the change handler
	// updates query), so it can't move to a static outer component. Compute
	// it once and render it in every branch, so the user always has a search
	// bar to type into or clear. A campus whose map has no home tile of its own
	// carries the button to it here.
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
				{hours.showsMapButton ? (
					<Stack.Toolbar.Button
						accessibilityLabel="Map"
						icon="map"
						onPress={() => router.navigate({pathname: '/map', params: {campus}})}
					/>
				) : null}
			</Stack.Toolbar>

			<SearchBar onChangeText={setQuery} value={query} />

			<HoursDevSheet
				campus={campus}
				isPresented={devSheetPresented}
				onIsPresentedChange={setDevSheetPresented}
			/>
		</>
	)

	if (isError) {
		return (
			<>
				{chrome}
				<LoadErrorView error={error} onRetry={refetch} />
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
				onShowAllSpaces={offerAllSpaces ? onShowAllSpaces : undefined}
				onToggleFavorite={onToggleFavorite}
				searchQuery={searchQuery}
				sections={sections}
			/>
		</>
	)
}

export default function HoursPage(): React.ReactNode {
	// No campus, or one this build doesn't know, is the active campus.
	let {campus: campusParam} = useLocalSearchParams<{campus?: string}>()
	let campus = useCampusParam(campusParam)
	let hours = campusById(campus).hours

	if (!hours) {
		return (
			<>
				<Stack.Title>Hours</Stack.Title>
				<NoticeView
					description="This campus has no building hours."
					systemImage="clock"
					title="No Hours"
				/>
			</>
		)
	}

	return (
		<>
			<Stack.Title>{hours.title}</Stack.Title>
			<HoursView campus={campus} hours={hours} />
		</>
	)
}
