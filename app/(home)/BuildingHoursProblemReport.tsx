import * as React from 'react'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {CloseScreenButton} from '@frogpond/navigation-buttons'

import {BuildingHoursProblemReportView} from '../../source/views/building-hours'
import {buildingByNameOptions} from '../../source/views/building-hours/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function BuildingHoursProblemReportPage(): React.ReactNode {
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
				title: 'Report a Problem',
				presentation: 'modal',
				headerRight: () => <CloseScreenButton title="Discard" />,
				gestureEnabled: false,
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
			<BuildingHoursProblemReportView initialBuilding={building} />
		</>
	)
}
