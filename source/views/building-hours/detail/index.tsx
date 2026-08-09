import * as React from 'react'
import {useMomentTimer} from '@frogpond/timer'
import {BuildingDetail} from './building'
import {timezone} from '@frogpond/constants'
import {useRouter} from 'expo-router'
import type {BuildingType} from '../types'

type Props = {
	building: BuildingType
}

export function BuildingHoursDetailView({
	building: info,
}: Props): React.ReactNode {
	let router = useRouter()
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})

	let reportProblem = React.useCallback(
		() =>
			router.push({
				pathname: '/BuildingHoursProblemReport',
				params: {name: info.name},
			}),
		[info.name, router],
	)

	return (
		<BuildingDetail info={info} now={now} onProblemReport={reportProblem} />
	)
}
