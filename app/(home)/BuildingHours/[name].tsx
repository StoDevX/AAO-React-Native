import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {BuildingHoursDetailView} from '../../../source/views/building-hours'
import {buildingByNameOptions} from '../../../source/views/building-hours/query'
import {BuildingFavoriteButton} from '../../../source/views/building-hours/detail/toolbar-button'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function BuildingHoursDetailPage(): React.ReactNode {
	let {name} = useLocalSearchParams<{name: string}>()
	let {
		data: building,
		isLoading,
		error,
		refetch,
	} = useQuery(buildingByNameOptions(name))

	let screen = (
		<Stack.Screen
			options={{
				title: building?.name ?? name,
				headerRight: building
					? () => <BuildingFavoriteButton buildingName={building.name} />
					: undefined,
			}}
		/>
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

	return (
		<>
			{screen}
			<BuildingHoursDetailView building={building} />
		</>
	)
}
