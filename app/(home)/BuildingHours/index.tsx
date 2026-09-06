import * as React from 'react'
import {useGroupedBuildings} from '../../../source/features/building-hours/query'
import {BuildingType} from '../../../source/features/building-hours/types'
import {BuildingList} from '../../../source/features/building-hours/list'

import {timezone} from '@frogpond/constants'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {Stack, useRouter} from 'expo-router'
import {useMomentTimer} from '@frogpond/timer'

function BuildingHoursView(): React.ReactNode {
	let router = useRouter()

	let {now} = useMomentTimer({intervalMs: 60000, startOf: 'minute', timezone: timezone()})

	let {data = [], error, refetch, isLoading, isError} = useGroupedBuildings()

	let onPressBuilding = React.useCallback(
		(building: BuildingType) =>
			router.push({
				pathname: '/BuildingHours/[name]',
				params: {name: building.name},
			}),
		[router],
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
		return <LoadingView />
	}

	return (
		<BuildingList
			isLoading={isLoading}
			now={now}
			onPressBuilding={onPressBuilding}
			onRefresh={refetch}
			sections={data}
		/>
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
