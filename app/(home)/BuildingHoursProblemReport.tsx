import * as React from 'react'
import {Stack, useLocalSearchParams, useNavigation} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {BuildingHoursProblemReportView} from '../../source/views/building-hours'
import {buildingByNameOptions} from '../../source/views/building-hours/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

function BuildingHoursProblemReportLoader(): React.ReactNode {
	let {name} = useLocalSearchParams<{name: string}>()
	let {
		data: building,
		isLoading,
		error,
		refetch,
	} = useQuery(buildingByNameOptions(name))

	if (isLoading) {
		return <LoadingView />
	}

	if (error) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`}
			/>
		)
	}

	if (!building) {
		return <NoticeView text={`Could not find the "${name}" building.`} />
	}

	return <BuildingHoursProblemReportView initialBuilding={building} />
}

export default function BuildingHoursProblemReportPage(): React.ReactNode {
	const navigation = useNavigation()

	return (
		<>
			<Stack.Title>Report a Problem</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<BuildingHoursProblemReportLoader />
		</>
	)
}
