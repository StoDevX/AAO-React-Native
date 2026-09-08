import * as React from 'react'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {useMomentTimer} from '@frogpond/timer'
import {timezone} from '@frogpond/constants'

import {BuildingDetailSwiftUI} from '../../../../source/features/building-hours/detail/building-detail'
import {buildingByNameOptions, parseCampus} from '../../../../source/features/building-hours/query'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {useAppDispatch, useAppSelector} from '../../../../source/redux/hooks'
import {
	isFavoriteBuilding,
	selectFavoriteBuildings,
	toggleFavoriteBuilding,
} from '../../../../source/redux/parts/buildings'

export default function CampusDetailPage(): React.ReactNode {
	let dispatch = useAppDispatch()
	let router = useRouter()

	let {name, campus: campusParam} = useLocalSearchParams<{name: string; campus?: string}>()
	let campus = parseCampus(campusParam)
	let {data: building, isLoading, error, refetch} = useQuery(buildingByNameOptions(campus, name))

	let favorites = useAppSelector(selectFavoriteBuildings)

	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})

	let onFavorite = React.useCallback(
		() => dispatch(toggleFavoriteBuilding({campus, name})),
		[campus, dispatch, name],
	)

	let reportProblem = React.useCallback(
		() =>
			router.push({
				pathname: '/Campus/detail/report',
				params: {name, campus},
			}),
		[campus, name, router],
	)

	let favorited = isFavoriteBuilding(favorites, campus, name)

	let screen = (
		<>
			<Stack.Title>{building?.name ?? name}</Stack.Title>
			<Stack.Screen options={{headerLargeTitle: true}} />
			<Stack.Toolbar placement="left">
				<Stack.Toolbar.Menu accessibilityLabel="More" icon="ellipsis.circle">
					<Stack.Toolbar.MenuAction icon="exclamationmark.bubble" onPress={reportProblem}>
						Report a Problem
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel={favorited ? 'Remove from Favorites' : 'Add to Favorites'}
					icon={favorited ? 'heart.fill' : 'heart'}
					onPress={onFavorite}
				/>
			</Stack.Toolbar>
		</>
	)

	if (isLoading) {
		return (
			<>
				{screen}
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				{screen}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!building) {
		return (
			<>
				{screen}
				<NoticeView text={`Could not find the "${name}" building.`} />
			</>
		)
	}

	// This screen's root inside the formSheet is BuildingDetailSwiftUI's
	// @expo/ui `Host`, not a React Native ScrollView -- the spike's "root
	// element must be a scroll view" rule doesn't apply here. That rule exists
	// because RNSScreenContentWrapper only knows how to manually resize a
	// direct RCTScrollViewComponentView child when a sheet's detent changes
	// natively, bypassing Fabric/Yoga entirely. `Host`'s hosting-controller
	// view sidesteps that whole problem: expo-modules-core gives it a plain
	// UIKit `autoresizingMask` (SwiftUIHostingView.swift), so it tracks its
	// superview's frame through ordinary UIKit view geometry, independent of
	// Fabric. Confirmed on device: dragging to the larger detent lays out the
	// full detail screen, footnote included (see
	// testDraggingTheDetailSheetRevealsTheRestOfItsContent).
	return (
		<>
			{screen}
			<BuildingDetailSwiftUI building={building} campus={campus} now={now} />
		</>
	)
}
